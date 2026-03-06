import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { RedisConnection, REDIS_CONNECTION } from "cache/RedisConnection.js";
import { LOGGER, Logger } from "logging/Logger.js";

export interface StoredResponse {
    statusCode: number;
    body: unknown;
}

/**
 * Redis-backed idempotency store.
 *
 * Scopes all keys to (userId, idempotencyKey) so keys from different users
 * cannot collide even if they send the same Idempotency-Key header value.
 *
 * TTL: 24 hours - industry standard (Stripe, Braintree use the same window).
 *
 * Lock mechanism: uses SET NX (set-if-not-exists) as an atomic 30-second
 * lock to reject concurrent duplicate requests before the first one finishes.
 */
@singleton()
export class IdempotencyService {
    private readonly redis;
    private readonly TTL_SECONDS = 86_400; // 24 hours

    constructor(
        @inject(REDIS_CONNECTION)
        private readonly redisConnection: RedisConnection,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {
        this.redis = redisConnection.getClient();
    }

    /**
     * Build the Redis key, scoped to userId to prevent cross-user key collisions.
     * userId is REQUIRED - never use a global key for idempotency.
     */
    private buildKey(userId: string, idempotencyKey: string): string {
        return `idempotency:${userId}:${idempotencyKey}`;
    }

    /**
     * Check if a response is already stored for this (userId, idempotencyKey) pair.
     * Returns the stored response on a hit, or null if this is a new request.
     * Fail-open: returns null on Redis error so the request is processed normally.
     */
    async get(
        userId: string,
        idempotencyKey: string,
    ): Promise<StoredResponse | null> {
        try {
            const key = this.buildKey(userId, idempotencyKey);
            const stored = await this.redis.get(key);
            if (!stored) return null;
            return JSON.parse(stored) as StoredResponse;
        } catch (err) {
            this.logger.error("[Idempotency] GET failed", {
                error: (err as Error).message,
            });
            return null; // fail open - let the request through
        }
    }

    /**
     * Persist the response for this idempotency key.
     * Called AFTER the request completes successfully (intercepted in the middleware).
     * Non-fatal: if this fails, the request succeeded - it just won't be idempotent on retry.
     */
    async store(
        userId: string,
        idempotencyKey: string,
        response: StoredResponse,
    ): Promise<void> {
        try {
            const key = this.buildKey(userId, idempotencyKey);
            await this.redis.setex(
                key,
                this.TTL_SECONDS,
                JSON.stringify(response),
            );
            this.logger.debug("[Idempotency] Stored response", { key });
        } catch (err) {
            this.logger.error("[Idempotency] STORE failed", {
                error: (err as Error).message,
            });
            // Non-fatal - request already succeeded, just won't be idempotent on retry
        }
    }

    /**
     * Acquire a 30-second processing lock to block concurrent duplicate requests.
     * Uses SET NX (atomic set-if-not-exists) - no race condition possible.
     *
     * @returns true if lock acquired (first request), false if another request
     *          with the same key is currently in-flight.
     */
    async acquireLock(
        userId: string,
        idempotencyKey: string,
    ): Promise<boolean> {
        try {
            const lockKey = `idempotency:lock:${userId}:${idempotencyKey}`;
            const result = await this.redis.set(lockKey, "1", "EX", 30, "NX");
            return result === "OK"; // "OK" = lock acquired; null = already locked
        } catch (err) {
            this.logger.error("[Idempotency] LOCK failed", {
                error: (err as Error).message,
            });
            return true; // fail open - let the request proceed
        }
    }

    /**
     * Release the processing lock once the response has been stored (or on error).
     * Non-fatal: lock has a 30s TTL as a safety net if release never runs.
     */
    async releaseLock(userId: string, idempotencyKey: string): Promise<void> {
        try {
            const lockKey = `idempotency:lock:${userId}:${idempotencyKey}`;
            await this.redis.del(lockKey);
        } catch {
            /* non-fatal - TTL will expire the lock automatically */
        }
    }
}
