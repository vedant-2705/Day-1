/**
 * @module RequestLogger
 * @description Provides a middleware function for logging incoming HTTP requests in an Express application.
 * The `requestLogger` middleware logs details about each request, including the HTTP method, URL, response status code, duration of the request, and the client's IP address.
 * The logging behavior can be configured based on the log level specified in the application configuration, allowing for different levels of verbosity (e.g., debug, warn, error).
 */

import { Request, Response, NextFunction } from "express";
import { config } from "config/env.js";

// --- Log levels for controlling the verbosity of request logging. The levels are defined in increasing order of severity (debug < warn < error) ---
const LOG_LEVELS = { debug: 0, warn: 1, error: 2 };

/**
 * Determines whether a log message should be output based on the specified log level and the configured log level in the application's environment configuration.
 * 
 * @param level The log level to check (e.g., "debug", "warn", "error").
 * @returns A boolean value indicating whether logging is enabled for the specified log level.
 */
function shouldLog(level: keyof typeof LOG_LEVELS): boolean {
    const configured = (config.logLevel as keyof typeof LOG_LEVELS) ?? "debug";
    return LOG_LEVELS[level] >= (LOG_LEVELS[configured] ?? 0);
}

/**
 * Logs each request as: `METHOD /path → STATUS (Xms) ip=x.x.x.x`
 * Output is color-coded by status range: green (2xx), yellow (4xx), red (5xx).
 * Skipped entirely when the configured log level is above "debug".
 */
export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    if (!shouldLog("debug")) return next();

    const start = Date.now();
    const { method, url, ip } = req;

    // Attach to "finish" so we capture the final status code and accurate duration
    res.on("finish", () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const color =
            status >= 500
                ? "\x1b[31m"
                : status >= 400
                  ? "\x1b[33m"
                  : "\x1b[32m";
        const reset = "\x1b[0m";
        const timestamp = new Date().toISOString();

        console.log(
            `${color}[${timestamp}] ${method} ${url} → ${status} (${duration}ms) ip=${ip}${reset} userAgent=${req.headers["user-agent"] ?? "unknown"}`,
        );
    });

    next();
}
