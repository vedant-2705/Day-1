import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError.js";

/**
 * Thrown when incoming request data fails validation.
 * Maps to HTTP 400 Bad Request.
 *
 * Pass the Zod or schema validation issues in `details` so the client
 * receives field-level feedback without exposing internal implementation.
 *
 * @example
 * throw new ValidationError("Invalid request body", zodError.issues);
 */
export class ValidationError extends AppError {
    constructor(
        message: string,
        
        /** Structured validation issues (e.g. Zod error details) to return in the response. */
        details?: any,
    ) {
        super(message, StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", details);
    }
}
