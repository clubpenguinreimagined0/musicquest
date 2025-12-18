import axios from 'axios';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const createAxiosInstance = (baseURL, timeout = 30000) => {
  const instance = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  instance.interceptors.response.use(
    response => response,
    async error => {
      const config = error.config;

      if (!config || !config.retry) {
        return Promise.reject(error);
      }

      config.retryCount = config.retryCount || 0;

      if (config.retryCount >= config.retry) {
        return Promise.reject(error);
      }

      config.retryCount += 1;

      const backoffDelay = Math.pow(2, config.retryCount - 1) * 1000;
      await sleep(backoffDelay);

      return instance(config);
    }
  );

  return instance;
};

export const axiosWithRetry = async (requestFn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries - 1) throw error;

      const delay = Math.pow(2, i) * 1000;
      console.warn(`Request failed, retrying in ${delay}ms... (attempt ${i + 1}/${retries})`);
      await sleep(delay);
    }
  }
};
