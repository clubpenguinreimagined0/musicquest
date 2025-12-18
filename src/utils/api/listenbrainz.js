import { createAxiosInstance } from './axiosConfig';
import { listenBrainzLimiter } from './rateLimiter';

const LISTENBRAINZ_API = 'https://api.listenbrainz.org/1';
const LISTENBRAINZ_LABS_API = 'https://labs.api.listenbrainz.org';

const apiClient = createAxiosInstance(LISTENBRAINZ_API);

export const fetchUserListens = async (username, token, count = 100, offset = 0, onProgress) => {
  try {
    const response = await listenBrainzLimiter.throttle(async () => {
      return await apiClient.get(`/user/${username}/listens`, {
        params: { count, offset },
        headers: token ? { Authorization: `Token ${token}` } : {},
        retry: 3
      });
    });

    if (onProgress) {
      onProgress({
        fetched: offset + response.data.listens.length,
        total: response.data.payload?.count || offset + response.data.listens.length
      });
    }

    return {
      success: true,
      listens: response.data.listens || [],
      count: response.data.payload?.count || 0
    };
  } catch (error) {
    console.error('Failed to fetch user listens:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      listens: []
    };
  }
};

export const fetchAllUserListens = async (username, token, onProgress) => {
  const allListens = [];
  const batchSize = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchUserListens(username, token, batchSize, offset, onProgress);

    if (!result.success) {
      return result;
    }

    if (result.listens.length === 0) {
      hasMore = false;
    } else {
      allListens.push(...result.listens);
      offset += batchSize;

      if (result.listens.length < batchSize) {
        hasMore = false;
      }
    }

    if (allListens.length >= 10000) {
      console.warn('Reached limit of 10,000 listens');
      hasMore = false;
    }
  }

  return {
    success: true,
    listens: allListens,
    count: allListens.length
  };
};

export const fetchSimilarArtists = async (artistMbid) => {
  try {
    const response = await listenBrainzLimiter.throttle(async () => {
      return await apiClient.get(`${LISTENBRAINZ_LABS_API}/similar-artists`, {
        params: {
          artist_mbid: artistMbid,
          algorithm: 'session_based_days_9000_session_300_contribution_5_threshold_15_limit_50_skip_30'
        },
        retry: 3
      });
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Failed to fetch similar artists:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
