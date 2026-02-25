/**
 * @module AppErrorHelper
 * @description Handler for application-level errors that extend {@link AppError}.
 * Translates known domain errors (e.g. NotFoundError, ConflictError, ValidationError)
 * into structured HTTP responses using the standard error response envelope.
 */

import { AppError } from "shared/errors/AppError.js";
import type { Request, Response } from "express";
import { errorResponse } from "helpers/ResponseHelper.js";
import { ValidationError } from "shared/errors/ValidationError.js";

/**
 * Formats and sends an HTTP response for any error that is an instance of {@link AppError}.
 *
 * @param err - The application error containing a status code, machine-readable code, and message.
 * @param req - The Express request object, used to populate the `instance` field in the error envelope.
 * @param res - The Express response object used to send the JSON error response.
 * @returns The Express response with the appropriate HTTP status code and error envelope.
 *
 * @remarks
 * If the error is a {@link ValidationError}, its `details` field (structured Zod issues)
 * is included in the response body to give the client actionable field-level feedback.
 * All other `AppError` subclasses receive an error response without a `details` payload.
 */
export const handleAppError = (err: AppError, req: Request, res: Response) => {
    return res.status(err.statusCode).json(
        errorResponse(
            // err.code is the machine-readable string from ERROR_CODES
            // e.g. "CONTACT_NOT_FOUND", "CONTACT_EMAIL_CONFLICT"
            err.code,
            err.message,
            err instanceof ValidationError ? err.details : undefined,
            req.path,
        ),
    );
};
