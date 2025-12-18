import DOMPurify from 'dompurify';

export function detectDataFormat(data, fileName = '') {
  console.log('🔍 Detecting format...', {
    isArray: Array.isArray(data),
    hasPayload: !!data.payload,
    firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null,
    fileName: fileName
  });

  if (!data) {
    throw new Error('No data provided');
  }

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];

    if (first.listened_at && first.track_metadata) {
      console.log('✅ Detected: ListenBrainz export format');
      return 'listenbrainz';
    }

    if (first.ts && first.master_metadata_track_name) {
      console.log('✅ Detected: Spotify streaming history');
      return 'spotify';
    }

    if (first.date?.uts && first.artist) {
      console.log('✅ Detected: Last.fm format');
      return 'lastfm';
    }
  }

  if (data.payload && Array.isArray(data.payload.listens)) {
    console.log('✅ Detected: ListenBrainz API response');
    return 'listenbrainz';
  }

  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.includes('spotify') || lowerFileName.includes('streaming_history')) {
    console.log('✅ Detected: Spotify (by filename)');
    return 'spotify';
  }

  if (lowerFileName.includes('listenbrainz')) {
    console.log('✅ Detected: ListenBrainz (by filename)');
    return 'listenbrainz';
  }

  if (lowerFileName.includes('lastfm') || lowerFileName.includes('last.fm')) {
    console.log('✅ Detected: Last.fm (by filename)');
    return 'lastfm';
  }

  console.error('❌ Unknown format:', {
    isArray: Array.isArray(data),
    firstItemKeys: Array.isArray(data) && data[0] ? Object.keys(data[0]) : [],
    topLevelKeys: typeof data === 'object' ? Object.keys(data) : []
  });

  throw new Error(
    'Unable to detect file format. Please upload:\n' +
    '• ListenBrainz JSON export, or\n' +
    '• Spotify extended streaming history'
  );
}

export function parseListenBrainzFormat(data) {
  try {
    const listens = Array.isArray(data)
      ? data
      : (data.payload?.listens || []);

    if (listens.length === 0) {
      throw new Error('No listens found in ListenBrainz file');
    }

    const parsedListens = listens.map((listen, index) => {
      const trackMetadata = listen.track_metadata || {};
      const listenedAt = listen.listened_at || Math.floor(Date.now() / 1000);

      return {
        id: `lb-${index}-${listenedAt}`,
        listened_at: listenedAt,
        timestamp: listenedAt * 1000,
        trackName: DOMPurify.sanitize(trackMetadata.track_name || 'Unknown Track'),
        artistName: DOMPurify.sanitize(trackMetadata.artist_name || 'Unknown Artist'),
        albumName: DOMPurify.sanitize(trackMetadata.release_name || 'Unknown Album'),
        recordingMsid: listen.recording_msid || null,
        additionalInfo: trackMetadata.additional_info || {},
        source: 'listenbrainz'
      };
    });

    console.log(`✅ Parsed ${parsedListens.length} ListenBrainz listens`);

    return {
      success: true,
      listens: parsedListens,
      count: parsedListens.length,
      format: 'listenbrainz'
    };
  } catch (error) {
    console.error('❌ ListenBrainz parsing error:', error);
    return {
      success: false,
      error: error.message,
      listens: []
    };
  }
}

export function parseSpotifyFormat(data) {
  try {
    const listens = Array.isArray(data) ? data : [];

    if (listens.length === 0) {
      throw new Error('No listens found in Spotify file');
    }

    const validListens = listens.filter(item => {
      return item.ts &&
             item.master_metadata_track_name &&
             item.master_metadata_album_artist_name &&
             (item.ms_played || 0) >= 30000;
    });

    const filteredCount = listens.length - validListens.length;
    console.log(`📊 Spotify: ${validListens.length} valid out of ${listens.length} total`);

    if (filteredCount > 0) {
      console.log(`🔍 Filtered out ${filteredCount} entries (skipped/short tracks)`);
    }

    const parsedListens = validListens.map((listen, index) => {
      const isoTimestamp = listen.ts;
      const timestampMs = new Date(isoTimestamp).getTime();
      const listenedAt = Math.floor(timestampMs / 1000);

      return {
        id: `spotify-${index}-${listenedAt}`,
        listened_at: listenedAt,
        timestamp: timestampMs,
        trackName: DOMPurify.sanitize(
          listen.master_metadata_track_name ||
          listen.spotify_track_uri?.split(':')[2] ||
          'Unknown Track'
        ),
        artistName: DOMPurify.sanitize(
          listen.master_metadata_album_artist_name ||
          'Unknown Artist'
        ),
        albumName: DOMPurify.sanitize(
          listen.master_metadata_album_album_name ||
          'Unknown Album'
        ),
        msPlayed: listen.ms_played || 0,
        additionalInfo: {
          spotify_track_uri: listen.spotify_track_uri,
          reason_start: listen.reason_start,
          reason_end: listen.reason_end,
          shuffle: listen.shuffle,
          skipped: listen.skipped,
          offline: listen.offline
        },
        source: 'spotify'
      };
    });

    console.log(`✅ Parsed ${parsedListens.length} Spotify listens`);

    return {
      success: true,
      listens: parsedListens,
      count: parsedListens.length,
      totalEntries: listens.length,
      filtered: filteredCount,
      format: 'spotify'
    };
  } catch (error) {
    console.error('❌ Spotify parsing error:', error);
    return {
      success: false,
      error: error.message,
      listens: []
    };
  }
}

export function parseLastFmFormat(data) {
  throw new Error('Last.fm format support coming soon');
}

export function parseUniversalData(fileContent, fileName) {
  console.log('📄 Parsing file:', fileName);

  try {
    const parsed = JSON.parse(fileContent);

    const format = detectDataFormat(parsed, fileName);

    let result;

    switch (format) {
      case 'listenbrainz':
        result = parseListenBrainzFormat(parsed);
        break;
      case 'spotify':
        result = parseSpotifyFormat(parsed);
        break;
      case 'lastfm':
        result = parseLastFmFormat(parsed);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    console.log(`📊 Parsed ${result.listens.length} listens from ${fileName}`);
    return result;

  } catch (error) {
    console.error('❌ Parse error:', error);

    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file. Please check the file format.');
    }

    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

export function validateUniversalData(data) {
  console.log('🔍 Validating parsed data...');

  if (!data || !data.listens || data.listens.length === 0) {
    console.error('❌ Validation failed: No listens found');
    return {
      isValid: false,
      error: 'No listens found in uploaded file.',
      details: 'Please upload a valid ListenBrainz or Spotify extended streaming history file.'
    };
  }

  const MIN_TIMESTAMP = 946684800;
  const MAX_TIMESTAMP = 2147483647;

  const timestamps = data.listens.map(l => l.listened_at);

  const validTimestamps = timestamps.filter(
    ts => typeof ts === 'number' && ts > MIN_TIMESTAMP && ts < MAX_TIMESTAMP
  );

  const validPercentage = (validTimestamps.length / timestamps.length) * 100;

  console.log(`📊 Timestamp validation: ${validPercentage.toFixed(1)}% valid (${validTimestamps.length}/${timestamps.length})`);

  if (validPercentage < 90) {
    console.error('❌ Validation failed: Too many invalid timestamps');
    return {
      isValid: false,
      error: `Data contains too many invalid timestamps (${validPercentage.toFixed(1)}% valid).`,
      details: `Found ${validTimestamps.length} valid out of ${timestamps.length} total listens. ` +
               `Please check your export file format.`,
      debugInfo: {
        sampleInvalidTimestamp: timestamps.find(ts => typeof ts !== 'number' || ts < MIN_TIMESTAMP || ts > MAX_TIMESTAMP),
        expectedFormat: 'Unix timestamp (e.g., 1609459200)',
        detectedFormat: typeof timestamps[0],
        firstTimestamp: timestamps[0]
      }
    };
  }

  const earliest = Math.min(...validTimestamps);
  const latest = Math.max(...validTimestamps);
  const yearSpan = (latest - earliest) / (365.25 * 24 * 60 * 60);

  const earliestDate = new Date(earliest * 1000);
  const latestDate = new Date(latest * 1000);

  console.log(`📅 Date range: ${earliestDate.toLocaleDateString()} to ${latestDate.toLocaleDateString()} (${yearSpan.toFixed(1)} years)`);

  if (yearSpan < 0.08) {
    console.error('❌ Validation failed: Data span too short');
    return {
      isValid: false,
      error: 'Data span too short.',
      details: `Found only ${(yearSpan * 365).toFixed(0)} days of listening history. Need at least 1 month.`
    };
  }

  console.log('✅ Validation passed');

  return {
    isValid: true,
    data: data,
    dateRange: {
      earliest: earliestDate,
      latest: latestDate
    },
    yearSpan: Math.round(yearSpan * 10) / 10,
    stats: {
      totalListens: data.listens.length,
      validTimestamps: validTimestamps.length,
      validPercentage: validPercentage.toFixed(1)
    }
  };
}
