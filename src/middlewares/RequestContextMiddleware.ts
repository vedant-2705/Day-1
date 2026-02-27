/**
 * @module RequestContextMiddleware
 * @description Express middleware that seeds the per-request {@link RequestContext} store.
 *
 * Must be mounted **after** `authMiddleware` on protected routes so that `req.user`
 * is already populated when the store is created. On public (unauthenticated) routes
 * it falls back to `'system'` for `userId`.
 *
 * A unique `requestId` (UUID v4) is generated for every request and stored alongside
 * the user's IP and User-Agent so that all log lines and audit entries produced during
 * the request can be correlated by that trace ID.
 */
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import {
    RequestContext,
    RequestContextStore,
} from "../lib/context/RequestContext.js";
import { AuthenticatedRequest } from "./AuthMiddleware.js";

/**
 * Builds the {@link RequestContextStore} from the incoming request and runs the
 * remainder of the Express middleware chain inside the store's async scope.
 *
 * Calling `next()` **inside** `RequestContext.run()` ensures that every downstream
 * middleware, controller, use case, and repository inherits this store for the
 * lifetime of the current async call chain.
 */
export function requestContextMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const authReq = req as AuthenticatedRequest;
    const store: RequestContextStore = {
        // Falls back to 'system' when the route is public (authMiddleware not yet run)
        userId: authReq.user?.userId ?? "system",

        // X-Forwarded-For is set by proxies/load balancers; fall back to direct socket address
        ip:
            (req.headers["x-forwarded-for"] as string) ??
            req.socket.remoteAddress ??
            null,

        userAgent: req.headers["user-agent"] ?? null,

        // Unique trace ID - correlates all log lines and audit entries for this request
        requestId: randomUUID(),
    };

    // .run() creates an isolated store for this async chain.
    // next() is called inside .run() so everything downstream inherits this store.
    RequestContext.run(store, next);
}
