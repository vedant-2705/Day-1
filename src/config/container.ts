/**
 * @module container
 * @description Configures the application's IoC container (tsyringe).
 * All dependency bindings are centralized here to enforce separation of concerns
 * and enable testability via injection.
 */

import "reflect-metadata";
import { registerInfrastructureContainer } from "./modules/InfrastructureContainer.js";
import { registerContactContainer } from "./modules/ContactContainer.js";
import { registerReportContainer } from "./modules/ReportContainer.js";
import { registerRefreshTokenContainer } from "./modules/RefreshTokenContainer.js";
import { registerUserContainer } from "./modules/UserContainer.js";
import { registerAuthContainer } from "./modules/AuthContainer.js";
import { registerAdminContainer } from "./modules/AdminContainer.js";

/**
 * Registers all application dependencies into the tsyringe DI container.
 * Must be called once at application startup, before any container.resolve() calls.
 *
 * Lifecycle conventions used here:
 * - `registerSingleton`: infrastructure and stateful services (DB, logger, repositories, mappers)
 * - `register` (transient): use cases - stateless per-request logic
 */
export function registerDependencies() {
    registerInfrastructureContainer();
    registerContactContainer();
    registerReportContainer();
    registerUserContainer();
    registerRefreshTokenContainer();
    registerAuthContainer();
    registerAdminContainer();
}
