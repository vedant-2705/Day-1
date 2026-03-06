/**
 * @module RateLimitContainer
 * @description Registers rate-limiting dependencies into the tsyringe IoC container.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { RateLimiter } from "lib/rate-limit/RateLimiter.js";

export function registerRateLimitContainer() {
    // Singleton: stateless - the Lua script runs in Redis; the class holds no per-request state
    container.registerSingleton(RateLimiter);
}
