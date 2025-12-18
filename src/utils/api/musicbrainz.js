import { createAxiosInstance } from './axiosConfig';
import { musicBrainzLimiter } from './rateLimiter';

const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2';

const apiClient = createAxiosInstance(MUSICBRAINZ_API);

export const searchArtist = async (artistName) => {
  try {
    const response = await musicBrainzLimiter.throttle(async () => {
      return await apiClient.get('/artist', {
        params: {
          query: artistName,
          fmt: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'MusicVisualizer/1.0.0 (https://github.com/music-visualizer)'
        },
        retry: 3
      });
    });

    if (response.data.artists && response.data.artists.length > 0) {
      const artist = response.data.artists[0];
      return {
        success: true,
        mbid: artist.id,
        name: artist.name,
        tags: artist.tags || []
      };
    }

    return {
      success: false,
      error: 'Artist not found'
    };
  } catch (error) {
    console.error('Failed to search artist:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const fetchArtistTags = async (mbid) => {
  try {
    const response = await musicBrainzLimiter.throttle(async () => {
      return await apiClient.get(`/artist/${mbid}`, {
        params: {
          fmt: 'json',
          inc: 'tags+genres'
        },
        headers: {
          'User-Agent': 'MusicVisualizer/1.0.0 (https://github.com/music-visualizer)'
        },
        retry: 3
      });
    });

    const tags = response.data.tags || [];
    const genres = response.data.genres || [];

    const allTags = [...tags, ...genres].filter(tag => tag.count && tag.count > 0);

    return {
      success: true,
      tags: allTags
    };
  } catch (error) {
    console.error('Failed to fetch artist tags:', error);
    return {
      success: false,
      error: error.message,
      tags: []
    };
  }
};
