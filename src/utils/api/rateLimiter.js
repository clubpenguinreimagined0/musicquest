export class RateLimiter {
  constructor(requestsPerSecond) {
    this.requestsPerSecond = requestsPerSecond;
    this.queue = [];
    this.processing = false;
    this.lastRequestTime = 0;
  }

  async throttle(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const { fn, resolve, reject } = this.queue.shift();

    const now = Date.now();
    const minDelay = 1000 / this.requestsPerSecond;
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, minDelay - timeSinceLastRequest);

    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }

    this.lastRequestTime = Date.now();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    }

    setTimeout(() => this.processQueue(), 0);
  }

  getRemainingFromHeaders(headers) {
    const remaining = headers['x-ratelimit-remaining'];
    const resetIn = headers['x-ratelimit-reset-in'];

    return {
      remaining: remaining ? parseInt(remaining, 10) : null,
      resetIn: resetIn ? parseInt(resetIn, 10) : null
    };
  }
}

export const listenBrainzLimiter = new RateLimiter(50);
export const musicBrainzLimiter = new RateLimiter(1);
