/**
 * @module Logger
 * @description Application-wide structured logger backed by Winston.
 *
 * Two exports:
 *   - `Logger` class   tsyringe-injectable singleton for use inside DI-managed
 *     classes (repositories, services, use cases).  Inject with `@inject(LOGGER)`.
 *   - `LOGGER`         DI injection token for the `Logger` class.
 *
 * Log levels:
 *   production  -> info  (excludes debug noise in prod)
 *   development -> debug (full query and context logging)
 */

import "reflect-metadata";
import { singleton } from "tsyringe";
import winston, { Logger as WinstonLogger } from "winston";


@singleton()
export class Logger {
    private readonly _logger: WinstonLogger;

    constructor() {
        this._logger = winston.createLogger({
            level: process.env.NODE_ENV === "production" ? "info" : "debug",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.printf(
                    ({ timestamp, level, message, ...meta }) => {
                        const metaStr = Object.keys(meta).length
                            ? "\n" + JSON.stringify(meta, null, 2)
                            : "";
                        return `${timestamp} [${level}]: ${message}${metaStr}`;
                    },
                ),
            ),
            transports: [new winston.transports.Console()],
        });
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this._logger.info(message, meta);
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this._logger.debug(message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this._logger.warn(message, meta);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this._logger.error(message, meta);
    }
}

/** DI injection token for {@link Logger}. */
export const LOGGER = Symbol.for("LOGGER");