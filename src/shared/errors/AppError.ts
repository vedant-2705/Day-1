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

/**
 * Base application error. Extend this class for domain-specific error types.
 *
 * @example
 * throw new AppError("Something went wrong", 500, "INTERNAL_ERROR");
 */
export class AppError extends Error {
    constructor(
        public readonly message: string,

        /** HTTP status code to send in the response. Defaults to 500. */
        public readonly statusCode: number = 500,

        /** Machine-readable error code for client-side error handling (e.g. "NOT_FOUND"). */
        public readonly errorCode?: string,

        /** Additional context or validation details to include in the error response. */
        public readonly details?: any,
    ) {
        super(message);
        this.name = this.constructor.name;
        
        // Removes the AppError constructor from the stack trace for cleaner diagnostics
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Serializes the error into a structured JSON shape.
     * Used by the global error middleware to build consistent API error responses.
     */
    toJSON() {
        return {
            error: {
                name: this.name,
                message: this.message,
                statusCode: this.statusCode,
                errorCode: this.errorCode,
                details: this.details,
            },
        };
    }
}