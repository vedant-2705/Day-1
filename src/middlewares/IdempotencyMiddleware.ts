import { Request, Response, NextFunction, RequestHandler } from "express";
import { container } from "tsyringe";
import { IdempotencyService } from "lib/idempotency/IdempotencyService.js";
import { StatusCodes } from "http-status-codes";
import { Logger, LOGGER } from "logging/Logger.js";
import { AuthenticatedRequest } from "middlewares/AuthMiddleware.js";

/**
 * Idempotency middleware factory.
 *
 * MUST run AFTER authMiddleware - it needs req.user.userId to scope keys per user.
 * MUST run BEFORE the controller - it intercepts res.json() to capture the response.
 *
 * Flow:
 *   1. Read Idempotency-Key header - if absent, pass through (opt-in per request)
 *   2. Check Redis for a stored response for (userId, idempotencyKey)
 *   3a. HIT  -> replay cached response immediately, skip controller entirely
 *   3b. MISS -> acquire processing lock to reject concurrent duplicates
 *   4. Monkey-patch res.json() to capture and store the response after it is sent
 *
 * Key scoping: keys are namespaced as `idempotency:{userId}:{idempotencyKey}` so
 * two users sending the same header value never interfere with each other.
 */
export function idempotencyMiddleware(): RequestHandler {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const idempotencyKey = req.headers["idempotency-key"] as
            | string
            | undefined;

        // If no key provided, pass through - idempotency is opt-in per request
        if (!idempotencyKey) {
            next();
            return;
        }

        // authMiddleware must have run before this - userId is required for key scoping
        const userId = (req as AuthenticatedRequest).user?.userId;
        if (!userId) {
            next(
                new Error(
                    "Idempotency middleware requires authentication (req.user.userId missing)",
                ),
            );
            return;
        }

        const service = container.resolve(IdempotencyService);
        const logger = container.resolve<Logger>(LOGGER);

        // Check for an existing stored response (replay) 
        const existing = await service.get(userId, idempotencyKey);
        if (existing) {
            logger.debug("[Idempotency] Replaying cached response", {
                idempotencyKey,
                userId,
            });
            res.status(existing.statusCode).json(existing.body);
            return;
        }

        // Acquire processing lock (reject concurrent duplicates) 
        const lockAcquired = await service.acquireLock(userId, idempotencyKey);
        if (!lockAcquired) {
            // Another request with the same key is currently being processed
            res.status(StatusCodes.CONFLICT).json({
                success: false,
                code: "IDEMPOTENCY_CONFLICT",
                message:
                    "A request with this idempotency key is currently being processed.",
            });
            return;
        }

        // Intercept res.json() to capture and store the response 
        // We monkey-patch res.json so we can store the response body + status
        // after it is sent to the client, without blocking the response.
        const originalJson = res.json.bind(res);
        res.json = (body: unknown) => {
            // Fire-and-forget: store the response, then release the lock.
            // We do NOT await - this must not delay the response to the client.
            service
                .store(userId, idempotencyKey, {
                    statusCode: res.statusCode,
                    body,
                })
                .finally(() => {
                    // Always release the lock - even if store() fails
                    void service.releaseLock(userId, idempotencyKey);
                });

            // Call the real res.json - sends the response to the client
            return originalJson(body);
        };

        next();
    };
}
