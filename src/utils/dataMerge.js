export function mergeListeningData(cachedData, importedData) {
  const allListens = [
    ...(cachedData || []),
    ...(importedData || [])
  ];

  if (allListens.length === 0) {
    return {
      listens: [],
      dateRange: null,
      stats: {
        totalListens: 0,
        uniqueArtists: 0,
        uniqueTracks: 0
      },
      mergeInfo: {
        cached: 0,
        imported: 0,
        duplicates: 0,
        total: 0
      }
    };
  }

  const uniqueListens = Array.from(
    new Map(
      allListens.map(listen => {
        const trackName = listen.trackName || listen.track_metadata?.track_name || '';
        const artistName = listen.artistName || listen.track_metadata?.artist_name || '';
        const timestamp = listen.timestamp || listen.listened_at || 0;
        const key = `${trackName}-${artistName}-${timestamp}`;
        return [key, listen];
      })
    ).values()
  );

  uniqueListens.sort((a, b) => {
    const aTime = a.timestamp || a.listened_at || 0;
    const bTime = b.timestamp || b.listened_at || 0;
    return aTime - bTime;
  });

  const timestamps = uniqueListens.map(l => l.timestamp || l.listened_at || 0);
  const earliestTimestamp = Math.min(...timestamps);
  const latestTimestamp = Math.max(...timestamps);

  const dateRange = {
    earliest: new Date(earliestTimestamp * 1000),
    latest: new Date(latestTimestamp * 1000),
    earliestTimestamp,
    latestTimestamp
  };

  const artists = new Set();
  const tracks = new Set();

  uniqueListens.forEach(listen => {
    const artistName = listen.artistName || listen.track_metadata?.artist_name;
    const trackName = listen.trackName || listen.track_metadata?.track_name;

    if (artistName) artists.add(artistName);
    if (trackName) tracks.add(trackName);
  });

  const stats = {
    totalListens: uniqueListens.length,
    uniqueArtists: artists.size,
    uniqueTracks: tracks.size
  };

  const mergeInfo = {
    cached: cachedData?.length || 0,
    imported: importedData?.length || 0,
    duplicates: allListens.length - uniqueListens.length,
    total: uniqueListens.length
  };

  console.log('Data merge complete:', {
    ...mergeInfo,
    dateRange: `${dateRange.earliest.getFullYear()}-${dateRange.latest.getFullYear()}`,
    stats
  });

  return {
    listens: uniqueListens,
    dateRange,
    stats,
    mergeInfo
  };
}

export function validateListeningData(data) {
  if (!data || !data.listens || data.listens.length === 0) {
    return {
      isValid: false,
      error: 'No listening data found. Please import your ListenBrainz data.'
    };
  }

  const timestamps = data.listens.map(l => l.timestamp || l.listened_at || 0);
  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);

  if (earliest === 0 || latest === 0) {
    return {
      isValid: false,
      error: 'Data contains invalid timestamps. Please check your data format.'
    };
  }

  const yearSpan = (latest - earliest) / (365.25 * 24 * 60 * 60);

  if (yearSpan < 0.033) {
    return {
      isValid: false,
      error: 'Data span too short. Need at least 1 month of listening history.'
    };
  }

  const MIN_TIMESTAMP = 946684800;
  const MAX_TIMESTAMP = 2147483647;

  const validTimestamps = data.listens.filter(
    l => {
      const ts = l.timestamp || l.listened_at || 0;
      return ts > MIN_TIMESTAMP && ts < MAX_TIMESTAMP;
    }
  );

  if (validTimestamps.length < data.listens.length * 0.9) {
    return {
      isValid: false,
      error: 'Data contains too many invalid timestamps. Please re-export from ListenBrainz.'
    };
  }

  return {
    isValid: true,
    data: data,
    dateRange: {
      earliest: new Date(earliest * 1000),
      latest: new Date(latest * 1000)
    },
    yearSpan: Math.round(yearSpan * 10) / 10
  };
}
