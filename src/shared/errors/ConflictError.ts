/**
 * @module ConflictError
 * @description Domain error representing an HTTP 409 Conflict.
 * Thrown when a write operation cannot be completed because it would violate
 * a uniqueness constraint or conflict with the current state of a resource
 * (e.g. a duplicate email address on contact creation).
 */

import { AppError } from "./AppError.js";
import { ErrorCode } from "constants/ErrorCodes.js";

/**
 * Thrown when a request conflicts with the current state of a resource.
 * Maps to HTTP 409 Conflict.
 *
 * @example
 * throw new ConflictError("CONTACT_EMAIL_CONFLICT", { email: "john@example.com" });
 */
export class ConflictError extends AppError {
    /**
     * @param errorCode - Key from {@link ERROR_CODES} for the specific conflict type.
     *                    Defaults to the generic `"CONFLICT"` code.
     * @param params    - Placeholder values to interpolate into the error message template.
     */
    constructor(errorCode: ErrorCode = 'CONFLICT', params: Record<string, string> = {}) {
        super(errorCode, params);
    }
}
