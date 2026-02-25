/**
 * @module AppError
 * @description Base class for all application-specific errors.
 * Extends the native `Error` with an HTTP `statusCode`, a machine-readable `errorCode`,
 * and optional `details` for structured error responses.
 *
 * All domain errors (NotFoundError, ConflictError, etc.) extend this class.
 * The global error middleware identifies instances of `AppError` to return
 * structured responses instead of generic 500s.
 */

import { ERROR_CODES, ErrorCode, formatMessage } from "constants/ErrorCodes.js";

/**
 * Base application error. Extend this class for domain-specific error types.
 *
 * @example
 * throw new AppError("Something went wrong", 500, "INTERNAL_ERROR");
 */

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly title: string;
    public readonly isOperational: boolean;
    public readonly details?: unknown;

    constructor(
        errorCode: ErrorCode,
        params: Record<string, string> = {},
        details?: unknown,
        isOperational = true,
    ) {
        const definition = ERROR_CODES[errorCode];
        super(formatMessage(definition.message, params));

        this.code = definition.code;
        this.statusCode = definition.statusCode;
        this.title = definition.title;
        this.isOperational = isOperational;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
