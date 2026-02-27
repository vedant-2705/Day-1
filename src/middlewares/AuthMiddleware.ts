/**
 * @module AuthMiddleware
 * @description Express middleware that authenticates incoming requests by verifying
 * the JWT access token supplied in the `Authorization` header.
 *
 * On success, the decoded payload is attached to `req.user` so downstream handlers
 * and middlewares can read the authenticated user's ID, email, and role without
 * hitting the database.
 *
 * This middleware only handles **access tokens**. Refresh tokens are stored in an
 * HttpOnly cookie and are only read by `AuthController.refresh`.
 */
import "reflect-metadata";
import { container } from "tsyringe";
import { ErrorKeys } from "constants/ErrorCodes.js";
import type { NextFunction, Request, Response } from "express";
import { UserRole } from "generated/prisma/client.js";
import { JwtService } from "lib/jwt/JwtService.js";
import { UnauthorizedError } from "shared/errors/UnauthorizedError.js";

/** Shape of the authenticated user payload attached to the request by this middleware. */
export interface AuthUser {
    userId: string;
    email: string;
    role: UserRole;
}

/** Extends the Express `Request` type with the `user` property set by {@link authMiddleware}. */
export interface AuthenticatedRequest extends Request {
    user: AuthUser;
}

/**
 * Verifies the JWT access token from the Authorization header.
 * On success - attaches decoded payload to req.user and calls next().
 * On failure - throws UnauthorizedError which the global error handler catches.
 *
 * Expected header format:
 *   Authorization: Bearer <access_token>
 *
 * Does NOT touch cookies - access token always comes from the header.
 * Refresh token is in the cookie, but that's only read by AuthController.refresh.
 */
export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const authHeader = req.headers['authorization'];

    // Header must exist and follow "Bearer <token>" format
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new UnauthorizedError(ErrorKeys.INVALID_TOKEN));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return next(new UnauthorizedError(ErrorKeys.INVALID_TOKEN));
    }

    try {
        // Resolve JwtService from container - middleware is a plain function, not a class
        // so we can't use constructor injection here
        const jwtService = container.resolve(JwtService);
        const decoded    = jwtService.verifyAccessToken(token);

        // Attach to request - downstream controllers and middlewares read from here
        (req as AuthenticatedRequest).user = {
            userId: decoded.userId,
            email:  decoded.email,
            role:   decoded.role,
        };

        next();
    } catch {
        // jwt.verify throws for expired tokens, invalid signature, malformed token
        // We don't leak which specific check failed
        return next(new UnauthorizedError(ErrorKeys.INVALID_TOKEN));
    }
}