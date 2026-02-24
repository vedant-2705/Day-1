/**
 * @module Logger
 * @description Lightweight console logger with per-level ANSI colour coding.
 * Registered as a singleton so all parts of the app share one instance.
 * Log output format: `[ISO timestamp] LEVEL ServiceName: message`
 */

import "reflect-metadata";
import { singleton } from "tsyringe";

export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
}

const COLORS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: "\x1b[36m", // cyan
    [LogLevel.INFO]: "\x1b[32m",  // green
    [LogLevel.WARN]: "\x1b[33m",  // yellow
    [LogLevel.ERROR]: "\x1b[31m", // red
};

const RESET = "\x1b[0m";

/**
 * Structured console logger. Prefix all output with timestamp, level, and service name.
 */
@singleton()
export class Logger {
    constructor(private readonly serviceName: string = "ContactService") {}

    /**
     * Core log writer. Formats and prints the log entry with ANSI colouring.
     * All public log methods delegate here.
     */
    private log(level: LogLevel, message: string, metadata?: any): void {
        const color = COLORS[level];
        const logEntry = {
            timestamp: new Date().toISOString(),
            service: this.serviceName,
            ...metadata,
        };

        const { timestamp, service, ...rest } = logEntry;
        const hasMeta = Object.keys(rest).length > 0;

        console.log(
            `${color}[${timestamp}] ${level} ${service}: ${message}${RESET}`,
            ...(hasMeta ? [rest] : []),
        );
    }

    /** Emits a DEBUG entry. Use for development diagnostics and query tracing. */
    debug(message: string, metadata?: any): void {
        this.log(LogLevel.DEBUG, message, metadata);
    }

    /** Emits an INFO entry. Use for normal operational events (startup, requests). */
    info(message: string, metadata?: any): void {
        this.log(LogLevel.INFO, message, metadata);
    }

    /** Emits a WARN entry. Use for recoverable issues that deserve attention. */
    warn(message: string, metadata?: any): void {
        this.log(LogLevel.WARN, message, metadata);
    }

    /**
     * Emits an ERROR entry. If `error` is an `Error` instance, its `name`, `message`,
     * and `stack` are extracted for structured output.
     */
    error(message: string, error?: any): void {
        this.log(LogLevel.ERROR, message, {
            error:
                error instanceof Error
                    ? {
                          name: error.name,
                          message: error.message,
                          stack: error.stack,
                      }
                    : error,
        });
    }
}

/** DI injection token for {@link Logger}. */
export const LOGGER = Symbol.for("LOGGER");