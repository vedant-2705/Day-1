import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { Redis } from "ioredis";
import { LOGGER, Logger } from "logging/Logger.js";
import { config } from "config/env.js";

/**
 * Singleton Redis client. One connection for the process lifetime.
 * Uses ioredis with exponential backoff reconnect strategy.
 */
@singleton()
export class RedisConnection {
    private readonly client: Redis;

    constructor(
        @inject(LOGGER)
        private readonly logger: Logger,
    ) {
        this.client = new Redis({
            host: config.redisHost || "localhost",
            port: Number(config.redisPort) || 6379,
            password: config.redisPassword || undefined,
            maxRetriesPerRequest: 3,
            // Exponential backoff on reconnect: 100ms, 200ms, 400ms, ... capped at 3s
            retryStrategy: (times) => Math.min(times * 100, 3000),
            enableReadyCheck: true,
            lazyConnect: false,
        });

        this.client.on("connect", () => this.logger.info("[Redis] Connected"));
        this.client.on("error", (err) =>
            this.logger.error("[Redis] Error", {
                error: (err as Error).message,
            }),
        );
        this.client.on("reconnecting", () =>
            this.logger.warn("[Redis] Reconnecting..."),
        );
    }

    getClient(): Redis {
        return this.client;
    }

    async ping(): Promise<void> {
        await this.client.ping();
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
        this.logger.info("[Redis] Disconnected");
    }
}

/** DI injection token for {@link RedisConnection}. */
export const REDIS_CONNECTION = Symbol.for("RedisConnection");
