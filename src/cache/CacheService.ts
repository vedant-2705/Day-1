import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { RedisConnection, REDIS_CONNECTION } from "./RedisConnection.js";
import { LOGGER, Logger } from "logging/Logger.js";

/**
 * Typed wrapper over Redis. All cache operations go through here.
 * Never call Redis directly from use cases - always go through CacheService.
 *
 * All methods are designed to NEVER throw - cache failures are non-fatal.
 * On Redis error, methods fail open so the application continues serving from the DB.
 */
@singleton()
export class CacheService {
    private readonly redis;

    constructor(
        @inject(REDIS_CONNECTION)
        private readonly redisConnection: RedisConnection,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {
        this.redis = redisConnection.getClient();
    }

    /**
     * Get a cached value. Returns null on miss or Redis error.
     * NEVER throws - cache miss is not an error.
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (err) {
            this.logger.error("[Cache] GET failed", {
                key,
                error: (err as Error).message,
            });
            return null; // fail open - go to DB
        }
    }

    /**
     * Store a value with TTL in seconds.
     * NEVER throws - cache write failure is non-fatal.
     */
    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        try {
            await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (err) {
            this.logger.error("[Cache] SET failed", {
                key,
                error: (err as Error).message,
            });
            // Do not throw - application continues without cache
        }
    }

    /**
     * Delete a specific key.
     * NEVER throws - cache delete failure is non-fatal.
     */
    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (err) {
            this.logger.error("[Cache] DEL failed", {
                key,
                error: (err as Error).message,
            });
        }
    }

    /**
     * Delete all keys matching a pattern (e.g. "contacts:user:abc123:*").
     * Uses SCAN to avoid blocking Redis with KEYS on large datasets.
     * Production-safe: KEYS is O(N) and blocks Redis; SCAN is O(1) per call.
     */
    async invalidatePattern(pattern: string): Promise<void> {
        try {
            let cursor = "0";
            let deletedCount = 0;
            do {
                const [nextCursor, keys] = await this.redis.scan(
                    cursor,
                    "MATCH",
                    pattern,
                    "COUNT",
                    100,
                );
                cursor = nextCursor;
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                    deletedCount += keys.length;
                }
            } while (cursor !== "0");

            if (deletedCount > 0) {
                this.logger.debug("[Cache] Pattern invalidated", {
                    pattern,
                    deletedCount,
                });
            }
        } catch (err) {
            this.logger.error("[Cache] INVALIDATE failed", {
                pattern,
                error: (err as Error).message,
            });
        }
    }
}
