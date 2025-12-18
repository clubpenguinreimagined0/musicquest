import { useMemo } from 'react';

export const DataHealthIndicator = ({ listens }) => {
  const stats = useMemo(() => {
    if (!listens || listens.length === 0) {
      return null;
    }

    const timestamps = listens.map(l => l.timestamp || l.listened_at || 0);
    const earliest = new Date(Math.min(...timestamps) * 1000);
    const latest = new Date(Math.max(...timestamps) * 1000);
    const yearSpan = ((Math.max(...timestamps) - Math.min(...timestamps)) / (365.25 * 24 * 60 * 60)).toFixed(1);

    const artists = new Set();
    const tracks = new Set();

    listens.forEach(listen => {
      const artistName = listen.artistName || listen.track_metadata?.artist_name;
      const trackName = listen.trackName || listen.track_metadata?.track_name;

      if (artistName) artists.add(artistName);
      if (trackName) tracks.add(trackName);
    });

    return {
      totalListens: listens.length,
      uniqueArtists: artists.size,
      uniqueTracks: tracks.size,
      earliest,
      latest,
      yearSpan: parseFloat(yearSpan)
    };
  }, [listens]);

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-green-900/20 border border-green-700 rounded-lg px-4 py-3 mb-6 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-400 text-lg">✓</span>
        <span className="text-green-300 font-semibold">
          Showing {stats.totalListens.toLocaleString()} listens from{' '}
          <strong>{stats.earliest.getFullYear()}</strong> to{' '}
          <strong>{stats.latest.getFullYear()}</strong>{' '}
          ({stats.yearSpan} years)
        </span>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-gray-400 ml-7">
        <div>
          <span className="text-gray-500">Artists:</span>{' '}
          <span className="text-white font-medium">{stats.uniqueArtists.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Tracks:</span>{' '}
          <span className="text-white font-medium">{stats.uniqueTracks.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export const GenreCleanupReport = ({ report, onClose }) => {
  if (!report) return null;

  const validPercentage = ((report.withValidGenres / report.total) * 100).toFixed(1);
  const unknownPercentage = ((report.setToUnknown / report.total) * 100).toFixed(1);

  return (
    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      )}
      <div className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
        <span>🧹</span>
        <span>Genre Data Cleaned</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-400">Valid genres:</span>
          <span className="text-white font-medium ml-2">
            {report.withValidGenres.toLocaleString()} ({validPercentage}%)
          </span>
        </div>
        <div>
          <span className="text-gray-400">Unknown:</span>
          <span className="text-white font-medium ml-2">
            {report.setToUnknown.toLocaleString()} ({unknownPercentage}%)
          </span>
        </div>
      </div>
      {report.artistNamesRemoved > 0 && (
        <div className="col-span-2 text-yellow-400 text-xs mt-3 bg-yellow-900/10 border border-yellow-700/30 rounded p-2">
          ⚠️ Removed {report.artistNamesRemoved} artist names that were incorrectly tagged as genres
        </div>
      )}
      {report.languagesMapped > 0 && (
        <div className="col-span-2 text-green-400 text-xs mt-2 bg-green-900/10 border border-green-700/30 rounded p-2">
          ✓ Mapped {report.languagesMapped} language/region tags to appropriate genres (e.g., hindi → bollywood)
        </div>
      )}
      {report.totalRemoved > 0 && (
        <div className="col-span-2 text-gray-400 text-xs mt-2">
          Total invalid tags removed: {report.totalRemoved.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export const MergeInfoReport = ({ mergeInfo, dateRange, onClose }) => {
  if (!mergeInfo) return null;

  const hasDuplicates = mergeInfo.duplicates > 0;
  const newListensAdded = mergeInfo.new - mergeInfo.duplicates;

  return (
    <div className="bg-cyan-900/20 border border-cyan-700 rounded-lg p-4 mb-4 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      )}
      <div className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
        <span>📊</span>
        <span>Import Complete</span>
      </div>

      {hasDuplicates && (
        <div className="bg-blue-900/20 border border-blue-600 rounded p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 text-lg">🔄</span>
            <span className="text-blue-300 font-semibold">Deduplication Report</span>
          </div>
          <div className="text-sm text-blue-200">
            Removed <strong className="text-blue-100">{mergeInfo.duplicates.toLocaleString()}</strong> duplicate
            listens (<strong>{mergeInfo.duplicateRate}%</strong> of imported data)
          </div>
          {mergeInfo.sampleDuplicates && mergeInfo.sampleDuplicates.length > 0 && (
            <div className="mt-2 text-xs text-blue-300/70">
              <div className="font-medium mb-1">Sample duplicates:</div>
              {mergeInfo.sampleDuplicates.map((dup, i) => (
                <div key={i} className="ml-2">
                  • "{dup.track}" by {dup.artist}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-400">Previously cached:</span>
          <span className="text-white font-medium ml-2">
            {mergeInfo.existing.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Newly imported:</span>
          <span className="text-white font-medium ml-2">
            {mergeInfo.new.toLocaleString()}
          </span>
        </div>
        {hasDuplicates && (
          <>
            <div>
              <span className="text-gray-400">New listens added:</span>
              <span className="text-green-400 font-medium ml-2">
                {newListensAdded.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Duplicates removed:</span>
              <span className="text-orange-400 font-medium ml-2">
                {mergeInfo.duplicates.toLocaleString()}
              </span>
            </div>
          </>
        )}
        <div className="col-span-2">
          <span className="text-gray-400">Total listens:</span>
          <span className="text-cyan-300 font-bold ml-2 text-lg">
            {mergeInfo.total.toLocaleString()}
          </span>
        </div>
      </div>
      {dateRange && (
        <div className="mt-3 text-xs text-gray-400 bg-gray-800/30 rounded p-2">
          Date range: {dateRange.earliest.toLocaleDateString()} to {dateRange.latest.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export const DataValidationError = ({ error }) => {
  if (!error) return null;

  return (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center mb-4">
      <div className="text-red-400 text-lg font-semibold mb-2">
        ⚠️ Data Validation Error
      </div>
      <div className="text-red-300">{error}</div>
    </div>
  );
};
