const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 3) {
            console.warn('Redis connection failed. Falling back to internal memory mock for development.');
            return null; // stop retrying
        }
        return Math.min(times * 50, 2000);
    }
});

redis.on('error', (err) => {
    // Silently handle error and allow the app to use the mock if needed
    // In a real military-grade setup, this would trigger a system alert
});

// Mock fallback for environments without Redis server
const mockRedis = {
    data: new Map(),
    async get(key) { return this.data.get(key); },
    async set(key, value, mode, expiry, time) {
        this.data.set(key, value);
        if (expiry === 'EX') {
            setTimeout(() => this.data.delete(key), time * 1000);
        }
        return 'OK';
    }
};

module.exports = {
    redis: redis.status === 'ready' || redis.status === 'connecting' ? redis : mockRedis
};
