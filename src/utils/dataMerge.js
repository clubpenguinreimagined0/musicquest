export function mergeListeningData(cachedData, importedData) {
  // Normalize timestamps for cached data
  const normalizedCached = (cachedData || []).map(listen => {
    const normalized = { ...listen };

    // Convert timestamp to seconds if in milliseconds
    if (normalized.timestamp && normalized.timestamp > 10000000000) {
      normalized.timestamp = Math.floor(normalized.timestamp / 1000);
    }

    // Ensure listened_at exists and is in seconds
    if (normalized.listened_at && normalized.listened_at > 10000000000) {
      normalized.listened_at = Math.floor(normalized.listened_at / 1000);
    } else if (!normalized.listened_at && normalized.timestamp) {
      normalized.listened_at = normalized.timestamp;
    }

    return normalized;
  });

  // Normalize timestamps for imported data
  const normalizedImported = (importedData || []).map(listen => {
    const normalized = { ...listen };

    // Convert timestamp to seconds if in milliseconds
    if (normalized.timestamp && normalized.timestamp > 10000000000) {
      normalized.timestamp = Math.floor(normalized.timestamp / 1000);
    }

    // Ensure listened_at exists and is in seconds
    if (normalized.listened_at && normalized.listened_at > 10000000000) {
      normalized.listened_at = Math.floor(normalized.listened_at / 1000);
    } else if (!normalized.listened_at && normalized.timestamp) {
      normalized.listened_at = normalized.timestamp;
    }

    return normalized;
  });

  const allListens = [
    ...normalizedCached,
    ...normalizedImported
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
  if (!data || !data.listens || !Array.isArray(data.listens)) {
    return {
      isValid: false,
      error: 'Invalid data structure: missing listens array'
    };
  }

  const listens = data.listens;

  if (listens.length === 0) {
    return {
      isValid: true,
      message: 'Empty dataset (no listens)'
    };
  }

  // Extract and normalize timestamps (convert milliseconds to seconds)
  const timestamps = listens.map(listen => {
    let ts = listen.timestamp || listen.listened_at;

    // Convert milliseconds to seconds if needed
    if (typeof ts === 'number' && ts > 10000000000) {
      ts = Math.floor(ts / 1000);
    }

    return ts;
  }).filter(ts => typeof ts === 'number' && ts > 0);

  if (timestamps.length === 0) {
    return {
      isValid: false,
      error: 'No valid timestamps found in data'
    };
  }

  // Valid Unix timestamp range (1970-2100)
  const MIN_VALID_TIMESTAMP = 0;
  const MAX_VALID_TIMESTAMP = 4102444800;

  const invalidTimestamps = timestamps.filter(
    ts => ts < MIN_VALID_TIMESTAMP || ts > MAX_VALID_TIMESTAMP
  );

  const invalidPercentage = (invalidTimestamps.length / timestamps.length) * 100;

  if (invalidPercentage > 10) {
    const earliest = new Date(Math.min(...timestamps) * 1000);
    const latest = new Date(Math.max(...timestamps) * 1000);

    console.error('❌ Validation failed:', {
      total: timestamps.length,
      invalid: invalidTimestamps.length,
      invalidPercent: invalidPercentage.toFixed(1) + '%',
      dateRange: `${earliest.toISOString()} to ${latest.toISOString()}`,
      sampleInvalid: invalidTimestamps.slice(0, 5)
    });

    return {
      isValid: false,
      error: `Data contains too many invalid timestamps (${invalidPercentage.toFixed(1)}%). Please re-export from source.`
    };
  }

  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);
  const yearSpan = (latest - earliest) / (365.25 * 24 * 60 * 60);

  return {
    isValid: true,
    message: `Valid dataset with ${listens.length} listens`,
    data: data,
    dateRange: {
      earliest: new Date(earliest * 1000),
      latest: new Date(latest * 1000)
    },
    yearSpan: Math.round(yearSpan * 10) / 10
  };
}
