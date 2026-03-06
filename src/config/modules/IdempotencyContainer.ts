/**
 * @module IdempotencyContainer
 * @description Registers idempotency infrastructure into the tsyringe IoC container.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { IdempotencyService } from "lib/idempotency/IdempotencyService.js";

export function registerIdempotencyContainer() {
    // Singleton: stateless wrapper over Redis - holds no per-request state
    container.registerSingleton(IdempotencyService);
}
