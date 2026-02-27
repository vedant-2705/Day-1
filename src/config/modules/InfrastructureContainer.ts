/**
 * @module InfrastructureContainer
 * @description Registers low-level infrastructure dependencies into the tsyringe IoC container.
 * This includes the application logger and the database connection, both of which are shared
 * singletons used throughout the entire application lifecycle.
 */

import "reflect-metadata";
import { DATABASE_CONNECTION, DatabaseConnection } from "database/DatabaseConnection.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { container } from "tsyringe";

export function registerInfrastructureContainer() {
    // --- Infrastructure (Singletons) ---
    // Singleton: shared logger instance to avoid duplicate transports across the app
    container.registerSingleton<Logger>(LOGGER, Logger);

    // Singleton: manages PrismaClient lifecycle; avoids multiple DB connection pools
    container.registerSingleton<DatabaseConnection>(
        DATABASE_CONNECTION,
        DatabaseConnection,
    );
}