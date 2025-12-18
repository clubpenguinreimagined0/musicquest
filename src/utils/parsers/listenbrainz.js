import DOMPurify from 'dompurify';

export const parseListenBrainzJSON = (data) => {
  try {
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid ListenBrainz JSON format: expected array');
    }

    const parsedListens = data.map((listen, index) => {
      const trackMetadata = listen.track_metadata || {};

      return {
        id: `lb-${index}-${listen.listened_at || Date.now()}`,
        timestamp: listen.listened_at ? listen.listened_at * 1000 : Date.now(),
        trackName: DOMPurify.sanitize(trackMetadata.track_name || 'Unknown Track'),
        artistName: DOMPurify.sanitize(trackMetadata.artist_name || 'Unknown Artist'),
        albumName: DOMPurify.sanitize(trackMetadata.release_name || 'Unknown Album'),
        recordingMsid: listen.recording_msid || null,
        additionalInfo: trackMetadata.additional_info || {},
        source: 'listenbrainz'
      };
    });

    return {
      success: true,
      listens: parsedListens,
      count: parsedListens.length
    };
  } catch (error) {
    console.error('ListenBrainz parsing error:', error);
    return {
      success: false,
      error: error.message,
      listens: []
    };
  }
};

export const validateListenBrainzJSON = (data) => {
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
  if (!firstListen.track_metadata) {
    return { valid: false, message: 'Missing track_metadata in first entry' };
  }

  return { valid: true, message: 'Valid ListenBrainz format' };
};
