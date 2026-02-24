/**
 * @module ErrorHandler
 * @description Global Express error-handling middleware.
 * Translates thrown errors into structured JSON responses.
 * Must be registered last in the middleware chain (after all routes).
 *
 * Error handling priority:
 *  1. ZodError                      -> 422 Unprocessable Entity (schema validation failure)
 *  2. AppError                      -> statusCode from the error (4xx/5xx domain errors)
 *  3. PrismaClientKnownRequestError -> mapped based on error code (e.g. unique constraint violation)
 *  4. Anything else                 -> 500 Internal Server Error
 */

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { AppError } from "shared/errors/AppError.js";
import { errorResponse } from "helpers/ResponseHelper.js";
import { handleZodError } from "helpers/errors/ZodErrorHelper.js";
import { handleAppError } from "helpers/errors/AppErrorHelper.js";
import { handlePrismaError } from "helpers/errors/PrismaErrorHelper.js";
import { Prisma } from "generated/prisma/client.js";

/**
 * Global error handler. Matches the Express 4-argument error middleware signature —
 * all four parameters are required even if unused, otherwise Express won't treat it as an error handler.
 *
 * @param err  - The error passed to `next(err)`
 * @param _req - Unused; required by Express error middleware signature
 * @param res  - Response object used to send the error payload
 * @param _next - Unused; required by Express error middleware signature
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (err instanceof ZodError) {
        handleZodError(err, res);
        return;
    }

    if (err instanceof AppError) {
        handleAppError(err, res);
        return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        handlePrismaError(err, res);
        return;
    }
    
    console.error("[Unhandled Error]", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred"),
    );
}
