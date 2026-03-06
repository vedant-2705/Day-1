/**
 * @module RedisContainer
 * @description Registers Redis infrastructure dependencies into the tsyringe IoC container.
 * Covers the Redis connection singleton and the CacheService wrapper.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { RedisConnection, REDIS_CONNECTION } from "cache/RedisConnection.js";
import { CacheService } from "cache/CacheService.js";

export function registerRedisContainer() {
    // Singleton: one Redis connection for the process lifetime
    container.registerSingleton(REDIS_CONNECTION, RedisConnection);

    // Singleton: stateless wrapper - safe to share across the app
    container.registerSingleton(CacheService);
}
