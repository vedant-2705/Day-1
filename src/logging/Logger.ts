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

@singleton()
export class Logger {
    constructor(private readonly serviceName: string = "ContactService") {}

    private log(level: LogLevel, message: string, metadata?: any): void {
        const color = COLORS[level];
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            service: this.serviceName,
            message,
            ...metadata,
        };

        console.log(
            `${color}[${logEntry.timestamp}] ${logEntry.level} ${logEntry.service}: ${logEntry.message}${RESET}`,
        );
    }

    debug(message: string, metadata?: any): void {
        this.log(LogLevel.DEBUG, message, metadata);
    }

    info(message: string, metadata?: any): void {
        this.log(LogLevel.INFO, message, metadata);
    }

    warn(message: string, metadata?: any): void {
        this.log(LogLevel.WARN, message, metadata);
    }

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

export const LOGGER = Symbol.for("LOGGER");