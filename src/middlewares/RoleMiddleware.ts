import { Request, Response, NextFunction } from "express";
import { UserRole } from "generated/prisma/client.js";
import { AuthenticatedRequest } from "./AuthMiddleware.js";
import { ForbiddenError } from "shared/errors/ForbiddenError.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

/**
 * Factory function that returns a middleware enforcing role-based access.
 *
 * Usage on routes:
 *   router.get('/admin-only', authMiddleware, requireRole('ADMIN'), handler)
 *   router.get('/any-user',   authMiddleware, requireRole('ADMIN', 'USER'), handler)
 *
 * Always place AFTER authMiddleware - requireRole reads req.user which
 * authMiddleware attaches. If authMiddleware hasn't run, req.user is undefined
 * and requireRole will throw 401 not 403.
 *
 * Returns 403 Forbidden (not 401 Unauthorized):
 *   401 = we don't know who you are (no/invalid token)
 *   403 = we know who you are, but you can't do this
 */
export function requireRole(...roles: UserRole[]) {
    return function (req: Request, res: Response, next: NextFunction): void {
        const authReq = req as AuthenticatedRequest;

        // should never happen if authMiddleware ran first
        if (!authReq.user) {
            return next(new ForbiddenError(ErrorKeys.INSUFFICIENT_PERMISSIONS));
        }

        if (!roles.includes(authReq.user.role)) {
            return next(new ForbiddenError(ErrorKeys.INSUFFICIENT_PERMISSIONS));
        }

        next();
    };
}
