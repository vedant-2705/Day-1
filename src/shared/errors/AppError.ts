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
    /** HTTP status code to send with the error response. */
    public readonly statusCode: number;

    /** Machine-readable error code (e.g. `"CONTACT_NOT_FOUND"`). */
    public readonly code: string;

    /** Human-readable title derived from the error code definition. */
    public readonly title: string;

    /**
     * Whether this error is an expected, operational error (domain/validation errors)
     * vs. an unexpected programming error. The global error handler uses this flag
     * to decide whether to send a structured response or a generic 500.
     */
    public readonly isOperational: boolean;

    /** Optional structured details (e.g. Zod validation issues) to include in the response. */
    public readonly details?: unknown;

    /**
     * @param errorCode     - Key from {@link ERROR_CODES} that defines the status, title, and message template.
     * @param params        - Placeholder values to interpolate into the message template (e.g. `{ id: '42' }`).
     * @param details       - Optional structured payload (e.g. field-level validation errors).
     * @param isOperational - Whether this is an expected operational error. Defaults to `true`.
     */
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

        // Ensures the stack trace starts at the subclass call site, not inside AppError
        Error.captureStackTrace(this, this.constructor);

        // Restores the correct prototype chain so `instanceof` checks work correctly
        // after TypeScript transpiles the class down to ES5.
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
