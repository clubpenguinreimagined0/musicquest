import { useEffect, useRef } from 'react';
import { getGenreColor } from '../../utils/genreColors';

const GenreTooltip = ({ data, position, visible }) => {
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (tooltipRef.current && visible) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (adjustedX + rect.width > window.innerWidth) {
        adjustedX = window.innerWidth - rect.width - 20;
      }

      if (adjustedY + rect.height > window.innerHeight) {
        adjustedY = adjustedY - rect.height - 20;
      }

      tooltip.style.left = `${adjustedX}px`;
      tooltip.style.top = `${adjustedY}px`;
    }
  }, [position, visible]);

  if (!visible || !data) return null;

  if (data.type === 'genre') {
    return (
      <div
        ref={tooltipRef}
        className="fixed z-50 pointer-events-none transition-opacity duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 min-w-[200px] max-w-[300px] backdrop-blur-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getGenreColor(data.genre) }}
            />
            <h3 className="font-bold text-sm uppercase tracking-wide">{data.genre}</h3>
          </div>

          <div className="text-xs space-y-1 text-gray-300">
            <p>
              <span className="font-semibold">{data.count.toLocaleString()}</span> listens
              <span className="ml-2">({data.percentage.toFixed(1)}%)</span>
            </p>

            {data.topArtists && data.topArtists.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="font-semibold mb-1">Top artists:</p>
                <ul className="space-y-0.5">
                  {data.topArtists.slice(0, 5).map((artist, idx) => (
                    <li key={idx} className="text-gray-400">
                      • {artist.artist} ({artist.count})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.peakPeriod && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p>
                  <span className="font-semibold">Peak:</span> {data.peakPeriod.periodLabel}
                  <span className="ml-1">({data.peakPeriod.percentage.toFixed(1)}%)</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (data.type === 'gateway_artist') {
    return (
      <div
        ref={tooltipRef}
        className="fixed z-50 pointer-events-none transition-opacity duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 min-w-[220px] max-w-[320px] backdrop-blur-lg border border-gray-700">
          <div className="mb-2">
            <h3 className="font-bold text-sm italic">{data.artist}</h3>
            <p className="text-xs text-gray-400">Gateway Artist</p>
          </div>

          <div className="text-xs space-y-1 text-gray-300">
            <p>
              <span className="font-semibold">Trigger genre:</span> {data.triggerGenre}
            </p>
            <p>
              <span className="font-semibold">First listen:</span>{' '}
              {new Date(data.firstListen).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Genre growth:</span> {data.genreGrowth}
            </p>
            <p>
              <span className="font-semibold">Subsequent listens:</span> {data.subsequentListens}
            </p>

            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-gray-400">
                Before: {data.beforePercentage}% → After: {data.afterPercentage}%
              </p>
            </div>

            {data.topTracks && data.topTracks.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="font-semibold mb-1">Top tracks:</p>
                <ul className="space-y-0.5">
                  {data.topTracks.slice(0, 3).map((track, idx) => (
                    <li key={idx} className="text-gray-400 truncate">
                      • {track.trackName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (data.type === 'period') {
    return (
      <div
        ref={tooltipRef}
        className="fixed z-50 pointer-events-none transition-opacity duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 min-w-[200px] backdrop-blur-lg border border-gray-700">
          <h3 className="font-bold text-sm mb-2">{data.periodLabel}</h3>

          <div className="text-xs space-y-1 text-gray-300">
            <p>
              <span className="font-semibold">Total listens:</span> {data.totalListens.toLocaleString()}
            </p>

            {data.topGenre && (
              <p>
                <span className="font-semibold">Top genre:</span> {data.topGenre.genre}
                <span className="ml-1">({data.topGenre.percentage.toFixed(1)}%)</span>
              </p>
            )}

            {data.newDiscoveries && (
              <p>
                <span className="font-semibold">New discoveries:</span> {data.newDiscoveries} artists
              </p>
            )}

            {data.gatewayArtists && data.gatewayArtists.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="font-semibold mb-1">Gateway artists:</p>
                <ul className="space-y-0.5">
                  {data.gatewayArtists.map((artist, idx) => (
                    <li key={idx} className="text-gray-400">
                      • {artist}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GenreTooltip;
