import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getGenreColor } from '../../utils/genreColors';
import { getTopArtistsForGenre, getGenrePeakPeriod } from '../../utils/gatewayArtistDetection';

const GenreGalaxyVisualization = ({
  groupedData,
  gatewayArtists,
  genreMap,
  listens,
  width,
  height,
  onGenreHover,
  onGenreClick,
  onGatewayArtistClick,
  selectedGenre,
  currentPeriodIndex = 0,
  unknownDisplay = 'faded'
}) => {
  const svgRef = useRef(null);
  const [hoveredGenre, setHoveredGenre] = useState(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRotation(prev => (prev + 0.3) % 360);
    }, 50);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!groupedData.length || !svgRef.current) return;

    renderGalaxy();
  }, [groupedData, width, height, hoveredGenre, selectedGenre, rotation, currentPeriodIndex, unknownDisplay]);

  const renderGalaxy = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 100;

    const allGenres = new Set();
    groupedData.forEach(period => {
      period.genres.forEach(g => allGenres.add(g.genre));
    });

    const genreList = Array.from(allGenres)
      .filter(g => unknownDisplay === 'hide' ? g !== 'Unknown' : true)
      .slice(0, 12);

    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    const spiralG = g.append('g').attr('class', 'spiral');

    const numPoints = groupedData.length;
    const spiralPoints = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 6;
      const radius = (i / numPoints) * (maxRadius * 0.4);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      spiralPoints.push({ x, y, index: i, periodLabel: groupedData[i].periodLabel });
    }

    const spiralLine = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCardinal);

    spiralG.append('path')
      .datum(spiralPoints)
      .attr('d', spiralLine)
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 2)
      .attr('opacity', 0.3);

    spiralPoints.forEach((point, idx) => {
      spiralG.append('circle')
        .attr('cx', point.x)
        .attr('cy', point.y)
        .attr('r', idx === currentPeriodIndex ? 6 : 3)
        .attr('fill', idx === currentPeriodIndex ? '#3B82F6' : '#6B7280')
        .attr('opacity', idx === currentPeriodIndex ? 1 : 0.5);

      if (idx % 5 === 0 || idx === currentPeriodIndex) {
        spiralG.append('text')
          .attr('x', point.x)
          .attr('y', point.y - 10)
          .attr('text-anchor', 'middle')
          .attr('font-size', idx === currentPeriodIndex ? '11px' : '9px')
          .attr('fill', 'currentColor')
          .attr('opacity', idx === currentPeriodIndex ? 1 : 0.4)
          .attr('font-weight', idx === currentPeriodIndex ? '600' : '400')
          .text(point.periodLabel);
      }
    });

    const currentPeriod = groupedData[currentPeriodIndex];
    if (!currentPeriod) return;

    const genreNodes = g.append('g').attr('class', 'genre-nodes');

    genreList
      .filter(g => g !== 'Unknown')
      .forEach((genre, idx) => {
        const genreData = currentPeriod.genres.find(g => g.genre === genre);
        if (!genreData) return;

        const angle = (idx / genreList.length) * Math.PI * 2 + (rotation * Math.PI / 180);
        const popularity = genreData.percentage;
        const radius = maxRadius * 0.6 + (popularity / 100) * (maxRadius * 0.3);

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const nodeSize = Math.max(20, Math.min(60, popularity * 3));

        const isHighlighted = hoveredGenre === genre || selectedGenre === genre;
        const isDimmed = (hoveredGenre && hoveredGenre !== genre) || (selectedGenre && selectedGenre !== genre);

        const node = genreNodes.append('g')
          .attr('transform', `translate(${x}, ${y})`)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            setHoveredGenre(genre);
            if (onGenreHover) {
              const topArtists = getTopArtistsForGenre(listens, genreMap, genre, 5);
              const peakPeriod = getGenrePeakPeriod(groupedData, genre);

              onGenreHover({
                type: 'genre',
                genre,
                count: genreData.count,
                percentage: genreData.percentage,
                topArtists,
                peakPeriod
              }, { x: event.pageX + 10, y: event.pageY + 10 });
            }
          })
          .on('mouseleave', () => {
            setHoveredGenre(null);
            if (onGenreHover) {
              onGenreHover(null, {});
            }
          })
          .on('click', () => {
            if (onGenreClick) {
              onGenreClick(genre);
            }
          });

        const gradientId = `gradient-${genre.replace(/\s+/g, '-')}`;
        const defs = svg.append('defs');
        const gradient = defs.append('radialGradient')
          .attr('id', gradientId);

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', getGenreColor(genre));

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', d3.color(getGenreColor(genre)).darker(1));

        node.append('circle')
          .attr('r', 0)
          .attr('fill', `url(#${gradientId})`)
          .attr('opacity', isDimmed ? 0.3 : 0.9)
          .attr('stroke', 'white')
          .attr('stroke-width', 3)
          .attr('filter', isHighlighted ? 'drop-shadow(0 0 12px rgba(255,255,255,0.8))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))')
          .transition()
          .duration(800)
          .delay(idx * 50)
          .attr('r', nodeSize);

        node.selectAll('circle')
          .transition()
          .duration(2000)
          .ease(d3.easeQuadInOut)
          .attr('r', nodeSize * 1.15)
          .transition()
          .duration(2000)
          .ease(d3.easeQuadInOut)
          .attr('r', nodeSize)
          .on('end', function repeat() {
            d3.select(this)
              .transition()
              .duration(2000)
              .ease(d3.easeQuadInOut)
              .attr('r', nodeSize * 1.15)
              .transition()
              .duration(2000)
              .ease(d3.easeQuadInOut)
              .attr('r', nodeSize)
              .on('end', repeat);
          });

        node.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', nodeSize + 15)
          .attr('font-size', '11px')
          .attr('font-weight', '700')
          .attr('fill', getGenreColor(genre))
          .attr('text-transform', 'uppercase')
          .attr('letter-spacing', '1px')
          .attr('opacity', 0)
          .text(genre.length > 10 ? genre.substring(0, 10) + '...' : genre)
          .transition()
          .duration(500)
          .delay(1000 + idx * 50)
          .attr('opacity', isDimmed ? 0.3 : 1);
      });

    gatewayArtists
      .filter(ga => ga.periodIndex === currentPeriodIndex)
      .forEach((gateway, idx) => {
        const genreIdx = genreList.indexOf(gateway.triggerGenre);
        if (genreIdx === -1) return;

        const angle = (genreIdx / genreList.length) * Math.PI * 2 + (rotation * Math.PI / 180);
        const genreData = currentPeriod.genres.find(g => g.genre === gateway.triggerGenre);
        if (!genreData) return;

        const popularity = genreData.percentage;
        const radius = maxRadius * 0.6 + (popularity / 100) * (maxRadius * 0.3);

        const x = Math.cos(angle) * radius * 0.7;
        const y = Math.sin(angle) * radius * 0.7;

        const connection = genreNodes.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', x)
          .attr('y2', y)
          .attr('stroke', getGenreColor(gateway.triggerGenre))
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0);

        connection.transition()
          .duration(500)
          .delay(1500 + idx * 100)
          .attr('opacity', 0.4);

        const marker = genreNodes.append('g')
          .attr('transform', `translate(${x}, ${y})`)
          .style('cursor', 'pointer')
          .attr('opacity', 0)
          .on('click', () => {
            if (onGatewayArtistClick) {
              onGatewayArtistClick(gateway);
            }
          });

        marker.append('circle')
          .attr('r', 6)
          .attr('fill', getGenreColor(gateway.triggerGenre))
          .attr('stroke', 'white')
          .attr('stroke-width', 2);

        marker.append('text')
          .attr('x', 0)
          .attr('y', -12)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-style', 'italic')
          .attr('fill', 'currentColor')
          .text(gateway.artist.substring(0, 15));

        marker.transition()
          .duration(500)
          .delay(1500 + idx * 100)
          .attr('opacity', 1);
      });
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="w-full h-auto"
    />
  );
};

export default GenreGalaxyVisualization;
