import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { RedisConnection, REDIS_CONNECTION } from "cache/RedisConnection.js";
import { v4 as uuidv4 } from "uuid";

export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number; // Unix timestamp in seconds
    retryAfter?: number; // Seconds until retry allowed (only when rejected)
}

/**
 * Atomic Lua script - runs as a single Redis command, no race conditions.
 *
 * Algorithm: sliding window using a sorted set.
 *   - Removes entries older than the current window
 *   - Counts current entries
 *   - If under limit: adds this request and resets the window TTL
 *   - If at limit: returns the time until the oldest entry ages out
 */
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local uid = ARGV[4]

-- Remove entries older than the current window
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Count current entries
local count = redis.call('ZCARD', key)

if count >= limit then
  -- Rejected: return remaining TTL for Retry-After header
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfter = 0
  if oldest[2] then
    retryAfter = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
  end
  return {0, count, limit, retryAfter}
end

-- Allowed: add this request
redis.call('ZADD', key, now, uid)
redis.call('PEXPIRE', key, window)

return {1, count + 1, limit, 0}
`;

/**
 * Redis sliding-window rate limiter.
 * Uses an atomic Lua script so there are no race conditions between
 * the count-check and the add-entry steps.
 *
 * Fail-open: if Redis is unavailable, requests are allowed through.
 * This keeps the app running during a Redis outage at the cost of
 * temporarily unenforced rate limits.
 */
@singleton()
export class RateLimiter {
    private readonly redis;

    constructor(
        @inject(REDIS_CONNECTION)
        private readonly redisConnection: RedisConnection,
    ) {
        this.redis = redisConnection.getClient();
    }

    /**
     * Check and record a request against the rate limit.
     *
     * @param identifier - Unique client identifier, e.g. "user:abc123" or "ip:1.2.3.4"
     * @param windowMs   - Length of the sliding window in milliseconds
     * @param limit      - Maximum requests allowed in the window
     * @returns {@link RateLimitResult} with allow/deny decision and header values
     */
    async check(
        identifier: string,
        windowMs: number,
        limit: number,
    ): Promise<RateLimitResult> {
        const key = `rate_limit:${identifier}`;
        const now = Date.now();

        try {
            const result = (await this.redis.eval(
                SLIDING_WINDOW_SCRIPT,
                1, // number of KEYS
                key, // KEYS[1]
                now, // ARGV[1]
                windowMs, // ARGV[2]
                limit, // ARGV[3]
                uuidv4(), // ARGV[4] - unique member for this request
            )) as [number, number, number, number];

            const [allowed, count, maxLimit, retryAfterSeconds] = result;
            const resetAt = Math.ceil((now + windowMs) / 1000);

            return {
                allowed: allowed === 1,
                limit: maxLimit,
                remaining: Math.max(0, maxLimit - count),
                resetAt,
                retryAfter: allowed === 0 ? retryAfterSeconds : undefined,
            };
        } catch {
            // Redis failure: FAIL OPEN - allow the request through.
            // Log is handled upstream; never take down the app due to a Redis outage.
            return {
                allowed: true,
                limit,
                remaining: limit - 1,
                resetAt: Math.ceil((now + windowMs) / 1000),
            };
        }
    }
}
