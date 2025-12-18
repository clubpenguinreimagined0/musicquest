import { createAxiosInstance } from './axiosConfig';
import { listenBrainzLimiter } from './rateLimiter';

const LISTENBRAINZ_API = 'https://api.listenbrainz.org/1';
const LISTENBRAINZ_LABS_API = 'https://labs.api.listenbrainz.org';

const apiClient = createAxiosInstance(LISTENBRAINZ_API);

export const fetchUserListens = async (username, token, count = 100, maxTs = null, minTs = null, onProgress) => {
  try {
    let url = `https://api.listenbrainz.org/1/user/${username}/listens?count=${count}`;
    if (maxTs) url += `&max_ts=${maxTs}`;
    if (minTs) url += `&min_ts=${minTs}`;

    const headers = token
      ? { 'Authorization': `Token ${token}` }
      : {};

    console.log(`📡 Fetching: ${url}`);

    const response = await listenBrainzLimiter.throttle(async () => {
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API returned ${res.status}: ${errorText}`);
      }

      return res.json();
    });

    // DEBUG: Log actual response structure
    console.log('📦 API Response:', {
      hasPayload: !!response.payload,
      payloadKeys: response.payload ? Object.keys(response.payload) : [],
      hasListens: !!response.payload?.listens,
      listensLength: response.payload?.listens?.length || 0
    });

    // CRITICAL FIX: Check if payload exists and has listens
    if (!response.payload) {
      throw new Error('API response missing payload. Check username and permissions.');
    }

    if (!response.payload.listens) {
      throw new Error('API response missing listens array. User may have no listening history.');
    }

    if (!Array.isArray(response.payload.listens)) {
      throw new Error('API response listens is not an array');
    }

    const listens = response.payload.listens;

    if (onProgress) {
      onProgress({
        fetched: listens.length,
        total: response.payload.count || listens.length
      });
    }

    return {
      success: true,
      listens: listens,
      count: response.payload.count || 0
    };
  } catch (error) {
    console.error('❌ fetchUserListens error:', error);
    return {
      success: false,
      error: error.message,
      listens: []
    };
  }
};

export const fetchAllUserListens = async (username, token, onProgress) => {
  const allListens = [];
  const batchSize = 100;
  let maxTs = null;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchUserListens(username, token, batchSize, maxTs, null, onProgress);

    if (!result.success) {
      return result;
    }

    if (result.listens.length === 0) {
      hasMore = false;
    } else {
      allListens.push(...result.listens);

      // Get the oldest timestamp from this batch for pagination
      const oldestListen = result.listens[result.listens.length - 1];
      maxTs = oldestListen?.listened_at || null;

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
