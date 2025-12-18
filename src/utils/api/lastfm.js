import { createAxiosInstance } from './axiosConfig';
import { getAPIConfig } from '../storage/indexedDB';

const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/';

const apiClient = createAxiosInstance(LASTFM_API);

export const fetchArtistInfo = async (artistName) => {
  try {
    const apiKey = await getAPIConfig('lastfm_api_key');

    if (!apiKey) {
      return {
        success: false,
        error: 'Last.fm API key not configured'
      };
    }

    const response = await apiClient.get('/', {
      params: {
        method: 'artist.getInfo',
        artist: artistName,
        api_key: apiKey,
        format: 'json',
        autocorrect: 1
      },
      retry: 3
    });

    if (response.data.error) {
      return {
        success: false,
        error: response.data.message || 'Artist not found'
      };
    }

    const artist = response.data.artist;
    if (!artist) {
      return {
        success: false,
        error: 'Artist not found'
      };
    }

    const tags = artist.tags?.tag || [];
    const genres = tags
      .filter(tag => tag.name)
      .map(tag => tag.name)
      .slice(0, 3);

    return {
      success: true,
      genres,
      mbid: artist.mbid || null,
      listeners: artist.stats?.listeners || 0,
      playcount: artist.stats?.playcount || 0
    };
  } catch (error) {
    console.error('Failed to fetch Last.fm artist info:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const fetchTopTags = async (artistName) => {
  try {
    const apiKey = await getAPIConfig('lastfm_api_key');

    if (!apiKey) {
      return {
        success: false,
        error: 'Last.fm API key not configured'
      };
    }

    const response = await apiClient.get('/', {
      params: {
        method: 'artist.getTopTags',
        artist: artistName,
        api_key: apiKey,
        format: 'json',
        autocorrect: 1
      },
      retry: 3
    });

    if (response.data.error) {
      return {
        success: false,
        error: response.data.message || 'Tags not found'
      };
    }

    const tags = response.data.toptags?.tag || [];
    const genres = tags
      .filter(tag => tag.name && tag.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(tag => tag.name)
      .slice(0, 3);

    return {
      success: true,
      genres
    };
  } catch (error) {
    console.error('Failed to fetch Last.fm top tags:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const searchArtist = async (artistName) => {
  try {
    const apiKey = await getAPIConfig('lastfm_api_key');

    if (!apiKey) {
      return {
        success: false,
        error: 'Last.fm API key not configured'
      };
    }

    const response = await apiClient.get('/', {
      params: {
        method: 'artist.search',
        artist: artistName,
        api_key: apiKey,
        format: 'json',
        limit: 1
      },
      retry: 3
    });

    if (response.data.error) {
      return {
        success: false,
        error: response.data.message || 'Artist not found'
      };
    }

    const results = response.data.results?.artistmatches?.artist || [];
    if (results.length === 0) {
      return {
        success: false,
        error: 'Artist not found'
      };
    }

    const artist = Array.isArray(results) ? results[0] : results;

    return {
      success: true,
      name: artist.name,
      mbid: artist.mbid || null,
      listeners: artist.listeners || 0
    };
  } catch (error) {
    console.error('Failed to search Last.fm artist:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
