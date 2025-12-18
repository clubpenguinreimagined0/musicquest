import DOMPurify from 'dompurify';

// DETECT SPOTIFY TIMESTAMP FORMAT
function detectSpotifyTimestampFormat(timestamp) {
  const ts = timestamp;

  // ISO 8601 string (e.g., "2021-01-01T00:00:00Z")
  if (typeof ts === 'string' && ts.includes('T')) {
    return 'iso8601';
  }

  // Unix timestamp in milliseconds (13 digits)
  if (typeof ts === 'number' && ts > 1000000000000) {
    return 'unix_ms';
  }

  // Unix timestamp in seconds (10 digits)
  if (typeof ts === 'number' && ts > 1000000000 && ts < 2000000000) {
    return 'unix_sec';
  }

  // Excel/Spotify serial date (days since 1900-01-01)
  if (typeof ts === 'number' && ts > 40000 && ts < 60000) {
    return 'excel_serial';
  }

  console.warn('⚠️ Unknown timestamp format:', ts, typeof ts);
  return 'unknown';
}

// CONVERT SPOTIFY TIMESTAMP TO UNIX SECONDS
function convertSpotifyTimestamp(timestamp, format) {
  switch (format) {
    case 'iso8601':
      // "2021-01-01T00:00:00Z" → Unix seconds
      return Math.floor(new Date(timestamp).getTime() / 1000);

    case 'unix_ms':
      // Milliseconds → seconds
      return Math.floor(timestamp / 1000);

    case 'unix_sec':
      // Already in correct format
      return timestamp;

    case 'excel_serial':
      // Excel serial date → Unix timestamp
      // Excel epoch: January 1, 1900 (but has a leap year bug)
      // Days 1-59 are off by 1 due to Excel treating 1900 as a leap year
      const excelEpoch = new Date(1900, 0, 1).getTime(); // Jan 1, 1900
      const daysToMs = timestamp * 24 * 60 * 60 * 1000;

      // Adjust for Excel's leap year bug (1900 was not a leap year)
      const adjustedDays = timestamp > 60 ? timestamp - 2 : timestamp - 1;
      const dateMs = excelEpoch + (adjustedDays * 24 * 60 * 60 * 1000);

      const unixTimestamp = Math.floor(dateMs / 1000);

      // DEBUG: Log the conversion
      console.log(`🔄 Converted Excel date ${timestamp} → Unix ${unixTimestamp} (${new Date(unixTimestamp * 1000).toISOString()})`);

      return unixTimestamp;

    default:
      console.error('❌ Cannot convert unknown timestamp format:', timestamp);
      // Fallback: assume it's a reasonable date and return current time
      return Math.floor(Date.now() / 1000);
  }
}

// SPOTIFY PARSER - Fixed for multiple timestamp formats
export const parseSpotifyJSON = (data) => {
  try {
    const listens = Array.isArray(data) ? data : [];

    if (listens.length === 0) {
      throw new Error('No listens found in Spotify file');
    }

    // Detect timestamp format from first valid entry
    const firstValidEntry = listens.find(item => item.ts);
    if (!firstValidEntry) {
      throw new Error('No valid timestamps found in Spotify data');
    }

    const timestampFormat = detectSpotifyTimestampFormat(firstValidEntry.ts);
    console.log(`🕐 Detected Spotify timestamp format: ${timestampFormat}`);

    // Filter valid entries
    const validListens = listens.filter(item => {
      return item.ts &&
             item.master_metadata_track_name &&
             item.master_metadata_album_artist_name &&
             (item.ms_played || 0) >= 30000;
    });

    console.log(`📊 Spotify: ${validListens.length} valid out of ${listens.length} total`);

    const parsedListens = validListens.map((item, index) => {
      // CRITICAL: Convert based on detected format
      const listenedAtUnix = convertSpotifyTimestamp(item.ts, timestampFormat);
      const timestamp = listenedAtUnix * 1000; // Convert to milliseconds for compatibility

      return {
        id: `spotify-${index}-${timestamp}`,
        timestamp,
        listened_at: listenedAtUnix,
        trackName: DOMPurify.sanitize(item.master_metadata_track_name || 'Unknown Track'),
        artistName: DOMPurify.sanitize(item.master_metadata_album_artist_name || 'Unknown Artist'),
        albumName: DOMPurify.sanitize(item.master_metadata_album_album_name || 'Unknown Album'),
        msPlayed: item.ms_played || 0,
        spotifyTrackUri: item.spotify_track_uri,
        originalTimestamp: item.ts,
        source: 'spotify'
      };
    });

    return {
      success: true,
      listens: parsedListens,
      count: parsedListens.length,
      totalEntries: listens.length,
      format: 'spotify',
      parsedAt: Date.now()
    };
  } catch (error) {
    console.error('Spotify parsing error:', error);
    return {
      success: false,
      error: error.message,
      listens: []
    };
  }
};

export const validateSpotifyJSON = (data) => {
  if (!data) {
    return { valid: false, message: 'No data provided' };
  }

  if (!Array.isArray(data)) {
    return { valid: false, message: 'Data must be an array' };
  }

  if (data.length === 0) {
    return { valid: false, message: 'Data array is empty' };
  }

  const firstListen = data[0];
  if (!firstListen.ts && !firstListen.master_metadata_track_name) {
    return { valid: false, message: 'Missing required fields in first entry' };
  }

  return { valid: true, message: 'Valid Spotify format' };
};
