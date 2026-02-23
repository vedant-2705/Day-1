import { Request, Response, NextFunction } from "express";
import { config } from "@config/env.js";

const LOG_LEVELS = { debug: 0, warn: 1, error: 2 };

function shouldLog(level: keyof typeof LOG_LEVELS): boolean {
    const configured = (config.logLevel as keyof typeof LOG_LEVELS) ?? "debug";
    return LOG_LEVELS[level] >= (LOG_LEVELS[configured] ?? 0);
}

export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    if (!shouldLog("debug")) return next();

    const start = Date.now();
    const { method, url, ip } = req;

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
            `${color}[${timestamp}] ${method} ${url} → ${status} (${duration}ms) ip=${ip}${reset}`,
        );
    });

    next();
}
