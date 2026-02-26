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