/**
 * @module env
 * @description Loads environment variables from .env files and provides a typed config object.
 * Uses `dotenv` to read .env files based on the current NODE_ENV (e.g. .env.development).
 * Validates required variables and exports a structured config object for use across the app.
 */

import path from "path";
import dotenv from "dotenv";

// Load the .env file matching the current NODE_ENV (e.g. .env.development)
const env = process.env.NODE_ENV || "development";
const envFile = path.resolve(process.cwd(), `.env.${env}`);
dotenv.config({ path: envFile });

/** Typed shape of all runtime configuration consumed by the application. */
interface AppConfig {
    env: string;
    port: number;
    appName: string;
    dbUrl: string;
    logLevel: string;
}

/**
 * Validates that all required environment variables are present and returns
 * a typed config object. Fails fast at startup if anything is missing -
 * prevents the app from running in a misconfigured state.
 *
 * @returns Typed config object sourced from environment variables
 * @throws {Error} If one or more required variables are not set
 */
function loadConfig(): AppConfig {
    const required = ["PORT", "APP_NAME", "DATABASE_URL", "LOG_LEVEL"];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(
            `Missing required env variables: ${missing.join(", ")}`,
        );
    }

    return {
        env,
        port: parseInt(process.env.PORT!, 10),
        appName: process.env.APP_NAME!,
        dbUrl: process.env.DATABASE_URL!,
        logLevel: process.env.LOG_LEVEL!,
    };
}

export const config = loadConfig();
