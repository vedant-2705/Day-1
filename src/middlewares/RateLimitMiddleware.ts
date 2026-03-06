import { Request, Response, NextFunction, RequestHandler } from "express";
import { container } from "tsyringe";
import { RateLimiter } from "lib/rate-limit/RateLimiter.js";
import { StatusCodes } from "http-status-codes";
import { errorResponse } from "helpers/ResponseHelper.js";
import { AuthenticatedRequest } from "middlewares/AuthMiddleware.js";
import { config } from "config/env.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

export interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    max: number; // Max requests allowed per window
    identifierFn: (req: Request) => string; // How to identify the client
}

/**
 * Factory that creates a rate-limiting middleware with the given configuration.
 *
 * Always sets X-RateLimit-* headers on every response (success and failure)
 * so clients can self-throttle before hitting the limit.
 *
 * Resolves RateLimiter lazily from the DI container (not at import time)
 * to avoid calling container.resolve() before registerDependencies().
 *
 * @example
 * router.post('/login', rateLimitMiddleware({ windowMs: 60_000, max: 10, identifierFn: byIp }))
 */
export function rateLimitMiddleware(opts: RateLimitOptions): RequestHandler {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const limiter = container.resolve(RateLimiter);
        const identifier = opts.identifierFn(req);
        const result = await limiter.check(identifier, opts.windowMs, opts.max);

        // Always set headers - even on success so clients can self-throttle
        res.setHeader("X-RateLimit-Limit", result.limit);
        res.setHeader("X-RateLimit-Remaining", result.remaining);
        res.setHeader("X-RateLimit-Reset", result.resetAt);

        if (!result.allowed) {
            const retryAfter = result.retryAfter ?? 60;
            res.setHeader("Retry-After", retryAfter);
            res.status(StatusCodes.TOO_MANY_REQUESTS).json(
                errorResponse(
                    ErrorKeys.RATE_LIMIT_EXCEEDED,
                    `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
                    undefined,
                    req.path,
                ),
            );
            return;
        }

        next();
    };
}

/**
 * Identifies a client by IP address.
 * Used for public/unauthenticated routes (login, register) to prevent brute force.
 */
export const byIp = (req: Request): string => `ip:${req.ip ?? "unknown"}`;

/**
 * Identifies a client by authenticated user ID, falling back to IP.
 * Used for authenticated API routes to prevent abuse per-account.
 */
export const byUserId = (req: Request): string =>
    `user:${(req as AuthenticatedRequest).user?.userId ?? req.ip ?? "unknown"}`;

/**
 * Pre-configured rate limiter for authentication routes.
 * 10 attempts per minute per IP - brute-force protection on login/register.
 */
export const authRateLimit = rateLimitMiddleware({
    windowMs: Number(config.rateLimitWindowMs) || 60_000,
    max: Number(config.rateLimitAuthMax) || 10,
    identifierFn: byIp,
});

/**
 * Pre-configured rate limiter for general API routes.
 * 100 requests per minute per authenticated user - abuse protection.
 */
export const apiRateLimit = rateLimitMiddleware({
    windowMs: Number(config.rateLimitWindowMs) || 60_000,
    max: Number(config.rateLimitMaxRequests) || 100,
    identifierFn: byUserId,
});
