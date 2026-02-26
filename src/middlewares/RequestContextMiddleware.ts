import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import {
    RequestContext,
    RequestContextStore,
} from "../lib/context/RequestContext.js";
import { AuthenticatedRequest } from "./AuthMiddleware.js";

export function requestContextMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const authReq = req as AuthenticatedRequest;
    const store: RequestContextStore = {
        userId: authReq.user?.userId ?? "system",

        // X-Forwarded-For is set by proxies/load balancers
        // Fall back to direct socket address
        ip:
            (req.headers["x-forwarded-for"] as string) ??
            req.socket.remoteAddress ??
            null,

        userAgent: req.headers["user-agent"] ?? null,

        // Unique ID per request - lets you find all audit logs from one request
        requestId: randomUUID(),
    };

    // .run() creates an isolated store for this async chain
    // next() is called inside .run() so everything downstream inherits this store
    RequestContext.run(store, next);
}
