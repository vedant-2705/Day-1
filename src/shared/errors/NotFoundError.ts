import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError.js";
import { ErrorCode } from "constants/ErrorCodes.js";

/**
 * Thrown when a requested resource cannot be found.
 * Maps to HTTP 404 Not Found.
 *
 * Automatically builds a descriptive message from the resource name and
 * optional identifier, so callers don't need to construct the message manually.
 *
 * @example
 * throw new NotFoundError("Contact", id);          // "Contact with identifier '123' not found"
 * throw new NotFoundError("Contact");               // "Contact not found"
 */
export class NotFoundError extends AppError {
    constructor(
        /** The name of the resource that was not found (e.g. "Contact"). */
        errorCode: ErrorCode = "NOT_FOUND",
        
        /** The identifier used in the lookup (e.g. a UUID). */
        params: Record<string, string> = {},
    ) {
        super(errorCode, params);
    }
}