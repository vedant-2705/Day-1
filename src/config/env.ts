/**
 * @module env
 * @description Loads environment variables from .env files and provides a typed config object.
 * Uses `dotenv` to read .env files based on the current NODE_ENV (e.g. .env.development).
 * Validates required variables and exports a structured config object for use across the app.
 */

import path from "path";
import dotenv from "dotenv";
import z from "zod";

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
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    jwtAccessExpiry: string;
    jwtRefreshExpiry: string;
    refreshTokenCookieName: string;
}

const envSchema = z.object({
    NODE_ENV:                   z.string().default("development"),
    PORT:                       z.string(),
    APP_NAME:                   z.string(),
    DATABASE_URL:               z.string(),
    LOG_LEVEL:                  z.string(),
    JWT_ACCESS_SECRET:          z.string().min(32),
    JWT_REFRESH_SECRET:         z.string().min(32),
    JWT_ACCESS_EXPIRY:          z.string().default('15m'),
    JWT_REFRESH_EXPIRY:         z.string().default('7d'),
    REFRESH_TOKEN_COOKIE_NAME:  z.string().default('training_refresh_token'),
});

// Validate and parse environment variables using Zod
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error("Environment variable validation failed:", parsedEnv.error.format());
    throw new Error("Invalid environment configuration");
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
    const required = ["PORT", "APP_NAME", "DATABASE_URL", "LOG_LEVEL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JWT_ACCESS_EXPIRY", "JWT_REFRESH_EXPIRY", "REFRESH_TOKEN_COOKIE_NAME"];

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

        jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
        jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY!,
        jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY!,
        refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME!,
    };
}

export const config = loadConfig();
