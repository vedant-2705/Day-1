/**
 * @module NotFoundError
 * @description Domain error representing an HTTP 404 Not Found.
 * Thrown when a requested resource cannot be located in the data store.
 * The error message is automatically derived from the provided {@link ErrorCode},
 * so callers do not need to construct messages manually.
 */

import { AppError } from "./AppError.js";
import { ErrorCode } from "constants/ErrorCodes.js";

/**
 * Thrown when a requested resource cannot be found.
 * Maps to HTTP 404 Not Found.
 *
 * @example
 * throw new NotFoundError("CONTACT_NOT_FOUND", { id: "abc-123" });
 * // => message: "Contact with id 'abc-123' was not found"
 */
export class NotFoundError extends AppError {
    /**
     * @param errorCode - Key from {@link ERROR_CODES} for the specific not-found variant.
     *                    Defaults to the generic `"NOT_FOUND"` code.
     * @param params    - Placeholder values to interpolate into the error message template
     *                    (e.g. `{ id: "abc-123" }`).
     */
    constructor(
        errorCode: ErrorCode = "NOT_FOUND",
        params: Record<string, string> = {},
    ) {
        super(errorCode, params);
    }
}