import DOMPurify from 'dompurify';

export const parseSpotifyJSON = (data) => {
  try {
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid Spotify JSON format: expected array');
    }

    const parsedListens = data.map((listen, index) => {
      const timestamp = listen.ts ? new Date(listen.ts).getTime() : Date.now();

      return {
        id: `spotify-${index}-${timestamp}`,
        timestamp,
        trackName: DOMPurify.sanitize(listen.master_metadata_track_name || 'Unknown Track'),
        artistName: DOMPurify.sanitize(listen.master_metadata_album_artist_name || 'Unknown Artist'),
        albumName: DOMPurify.sanitize(listen.master_metadata_album_album_name || 'Unknown Album'),
        msPlayed: listen.ms_played || 0,
        source: 'spotify'
      };
    });

    const filteredListens = parsedListens.filter(listen => listen.msPlayed > 30000);

    return {
      success: true,
      listens: filteredListens,
      count: filteredListens.length,
      totalEntries: parsedListens.length
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
