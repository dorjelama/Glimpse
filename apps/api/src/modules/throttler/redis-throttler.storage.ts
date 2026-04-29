import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

// Atomically increments the hit counter and sets TTL on first hit.
// Returns [totalHits, pttl_ms].
const INCR_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return {hits, redis.call('PTTL', KEYS[1])}
`;

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(url: string) {
    this.redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
    this.redis.on('error', (err: Error) => this.logger.error('Redis error', err.message));
    this.redis.on('connect', () => this.logger.log('Redis connected'));
  }

  async increment(key: string, ttl: number, limit: number, _blockDuration: number, throttlerName: string) {
    const redisKey = `throttle:${throttlerName}:${key}`;
    try {
      const [hits, pttl] = (await this.redis.eval(INCR_SCRIPT, 1, redisKey, String(ttl))) as [number, number];
      return {
        totalHits: hits,
        timeToExpire: Math.ceil(Math.max(0, pttl) / 1000),
        isBlocked: hits > limit,
        timeToBlockExpire: 0,
      };
    } catch (err: any) {
      // Fail open — never take down the service because Redis is unavailable
      this.logger.error('Redis throttler increment failed, failing open', err.message);
      return { totalHits: 1, timeToExpire: 60, isBlocked: false, timeToBlockExpire: 0 };
    }
  }

  disconnect() {
    this.redis.disconnect();
  }
}
