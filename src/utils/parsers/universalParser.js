// ═══════════════════════════════════════════════════════════
// UNIVERSAL DATA PARSER - Spotify + ListenBrainz
// ═══════════════════════════════════════════════════════════

export function parseImportedData(fileContent, fileName) {
  console.log('📄 Parsing file:', fileName);
  
  try {
    const parsed = JSON.parse(fileContent);
    const format = detectDataFormat(parsed, fileName);
    
    console.log(`✅ Detected format: ${format}`);
    
    let result;
    
    switch (format) {
      case 'listenbrainz':
        result = parseListenBrainzFormat(parsed);
        break;
      case 'spotify':
        result = parseSpotifyFormat(parsed);
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

// ═══════════════════════════════════════════════════════════
// FORMAT DETECTION
// ═══════════════════════════════════════════════════════════

function detectDataFormat(data, fileName = '') {
  console.log('🔍 Detecting format...', {
    isArray: Array.isArray(data),
    hasPayload: !!data.payload,
    firstItem: Array.isArray(data) ? data[0] : null,
    fileName: fileName
  });
  
  // ListenBrainz export (array)
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    
    if (first.listened_at && first.track_metadata) {
      console.log('✅ Detected: ListenBrainz export');
      return 'listenbrainz';
    }
    
    if (first.ts && (first.master_metadata_track_name || first.episode_name)) {
      console.log('✅ Detected: Spotify streaming history');
      return 'spotify';
    }
  }
  
  // ListenBrainz API response
  if (data.payload && Array.isArray(data.payload.listens)) {
    console.log('✅ Detected: ListenBrainz API response');
    return 'listenbrainz';
  }
  
  // Filename fallback
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.includes('spotify') || lowerFileName.includes('streaming')) {
    console.log('✅ Detected: Spotify (by filename)');
    return 'spotify';
  }
  
  throw new Error(
    'Unable to detect file format. Please upload:\n' +
    '• ListenBrainz JSON export, or\n' +
    '• Spotify extended streaming history'
  );
}

// ═══════════════════════════════════════════════════════════
// LISTENBRAINZ PARSER
// ═══════════════════════════════════════════════════════════

function parseListenBrainzFormat(data) {
  const listens = Array.isArray(data) ? data : (data.payload?.listens || []);
  
  if (listens.length === 0) {
    throw new Error('No listens found in ListenBrainz file');
  }
  
  return {
    listens: listens.map(item => ({
      listened_at: item.listened_at,
      track_metadata: {
        track_name: item.track_metadata?.track_name || 'Unknown Track',
        artist_name: item.track_metadata?.artist_name || 'Unknown Artist',
        release_name: item.track_metadata?.release_name || null,
        additional_info: item.track_metadata?.additional_info || {}
      },
      genre: null,
      source: 'listenbrainz'
    })),
    format: 'listenbrainz',
    parsedAt: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════
// SPOTIFY PARSER WITH TIMESTAMP CONVERSION
// ═══════════════════════════════════════════════════════════

function parseSpotifyFormat(data) {
  const listens = Array.isArray(data) ? data : [];
  
  if (listens.length === 0) {
    throw new Error('No listens found in Spotify file');
  }
  
  // Filter valid entries (music tracks only, min 30 seconds)
  const validListens = listens.filter(item => {
    return item.ts && 
           item.master_metadata_track_name && 
           item.master_metadata_album_artist_name &&
           (item.ms_played || 0) >= 30000;
  });
  
  console.log(`📊 Spotify: ${validListens.length} valid out of ${listens.length} total`);
  console.log(`🔍 Filtered out ${listens.length - validListens.length} entries (skipped/short tracks)`);
  
  // Convert timestamps
  const convertedListens = validListens.map((item, index) => {
    const originalTs = item.ts;
    const unixTimestamp = convertSpotifyTimestamp(originalTs);
    
    // Debug first 3 conversions
    if (index < 3) {
      console.log(`🔄 Timestamp ${index}:`, {
        original: originalTs,
        type: typeof originalTs,
        converted: unixTimestamp,
        date: new Date(unixTimestamp * 1000).toISOString()
      });
    }
    
    return {
      listened_at: unixTimestamp,
      track_metadata: {
        track_name: item.master_metadata_track_name,
        artist_name: item.master_metadata_album_artist_name,
        release_name: item.master_metadata_album_album_name || null,
        additional_info: {
          ms_played: item.ms_played,
          spotify_track_uri: item.spotify_track_uri,
          original_timestamp: originalTs
        }
      },
      genre: null,
      source: 'spotify'
    };
  });
  
  console.log(`✅ Parsed ${convertedListens.length} Spotify listens`);
  
  return {
    listens: convertedListens,
    format: 'spotify',
    parsedAt: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════
// SPOTIFY TIMESTAMP CONVERTER (CRITICAL FUNCTION)
// ═══════════════════════════════════════════════════════════

function convertSpotifyTimestamp(timestamp) {
  // ISO 8601 string (most common format now)
  if (typeof timestamp === 'string') {
    try {
      // Handle "2024-05-04T18:32:49Z" format
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        console.error('❌ Invalid ISO timestamp:', timestamp);
        return Math.floor(Date.now() / 1000); // Fallback to now
      }
      
      const unixSec = Math.floor(date.getTime() / 1000);
      return unixSec;
      
    } catch (error) {
      console.error('❌ Error parsing timestamp:', timestamp, error);
      return Math.floor(Date.now() / 1000);
    }
  }
  
  // Unix timestamp in milliseconds (13 digits)
  if (typeof timestamp === 'number' && timestamp > 1000000000000) {
    return Math.floor(timestamp / 1000);
  }
  
  // Unix timestamp in seconds (10 digits) - already correct
  if (typeof timestamp === 'number' && timestamp > 1000000000 && timestamp < 2000000000) {
    return timestamp;
  }
  
  // Excel serial date (rare, but handle it)
  if (typeof timestamp === 'number' && timestamp > 40000 && timestamp < 60000) {
    const excelEpoch = new Date(1900, 0, 1).getTime();
    const adjustedDays = timestamp > 60 ? timestamp - 2 : timestamp - 1;
    const dateMs = excelEpoch + (adjustedDays * 24 * 60 * 60 * 1000);
    return Math.floor(dateMs / 1000);
  }
  
  // Unknown format - log and return current time
  console.error('❌ Unknown timestamp format:', timestamp, typeof timestamp);
  return Math.floor(Date.now() / 1000);  // ← FIXED: Complete line!
}

// ═══════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════

export function validateUniversalData(data) {
  if (!data) {
    return { valid: false, message: 'No data provided' };
  }

  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const format = detectDataFormat(parsed, '');
    return { valid: true, format, message: `Valid ${format} format` };
  } catch (error) {
    return { valid: false, message: error.message };
  }
}

export function parseUniversalData(fileContent, fileName) {
  return parseImportedData(fileContent, fileName);
}
