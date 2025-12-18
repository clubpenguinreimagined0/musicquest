export const prepareVisualizationData = (listens, genreMap) => {
  const genreStats = new Map();
  const totalListens = listens.length;

  listens.forEach(listen => {
    const genres = genreMap.get(listen.artistName) || ['Unknown'];
    genres.forEach(genre => {
      genreStats.set(genre, (genreStats.get(genre) || 0) + 1);
    });
  });

  const primary = [];
  const secondary = [];
  const tertiary = [];
  let unknownCount = 0;

  genreStats.forEach((count, genre) => {
    const percentage = (count / totalListens) * 100;

    if (genre === 'Unknown') {
      unknownCount = count;
    } else if (percentage > 5) {
      primary.push({ genre, count, percentage });
    } else if (percentage > 1) {
      secondary.push({ genre, count, percentage });
    } else if (count > 10) {
      tertiary.push({ genre, count, percentage });
    }
  });

  const mainGenres = [...primary, ...secondary]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    mainGenres,
    unknownLayer: {
      count: unknownCount,
      percentage: (unknownCount / totalListens) * 100,
      style: {
        opacity: 0.2,
        zIndex: 0,
        color: '#495057'
      }
    },
    classifiedPercentage: ((totalListens - unknownCount) / totalListens) * 100,
    totalGenres: genreStats.size,
    allGenres: Array.from(genreStats.entries()).map(([genre, count]) => ({
      genre,
      count,
      percentage: (count / totalListens) * 100
    }))
  };
};

export const calculateTrackPlayCounts = (listens) => {
  const trackCounts = new Map();

  listens.forEach(listen => {
    const trackKey = `${listen.artistName}|||${listen.trackName}`;
    trackCounts.set(trackKey, (trackCounts.get(trackKey) || 0) + 1);
  });

  return Array.from(trackCounts.entries())
    .map(([key, count]) => {
      const [artistName, trackName] = key.split('|||');
      return { artistName, trackName, count };
    })
    .sort((a, b) => b.count - a.count);
};

export const prioritizeTracksForClassification = (tracks, percentile = 20) => {
  const topCount = Math.ceil(tracks.length * (percentile / 100));
  const topTracks = tracks.slice(0, topCount);
  const remainingTracks = tracks.slice(topCount);

  return { topTracks, remainingTracks };
};

export const generateMilestones = (groupedData, genreMap, gatewayArtists) => {
  const milestones = [];

  gatewayArtists.slice(0, 10).forEach(gateway => {
    milestones.push({
      type: 'gateway_artist',
      periodIndex: gateway.periodIndex,
      periodLabel: gateway.periodLabel,
      timestamp: gateway.firstListen.getTime(),
      title: `Discovered ${gateway.artist}`,
      subtitle: gateway.firstTrack ? `First track: "${gateway.firstTrack}"` : '',
      description: `Led to ${gateway.percentageIncrease}% growth in ${gateway.triggerGenre}`,
      details: {
        before: `${gateway.triggerGenre}: ${gateway.genreGrowthBefore}%`,
        after: `${gateway.triggerGenre}: ${gateway.genreGrowthAfter}%`,
        plays: `${gateway.totalPlays} total plays`
      },
      genre: gateway.triggerGenre,
      artist: gateway.artist,
      data: gateway
    });
  });

  return milestones.sort((a, b) => a.timestamp - b.timestamp);
};
