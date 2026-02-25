import { AppError } from "./AppError.js";
import { ErrorCode } from "constants/ErrorCodes.js";

/**
 * Thrown when a request conflicts with the current state of a resource.
 * Maps to HTTP 409 Conflict.
 *
 * @example
 * // Duplicate email on contact creation
 * throw new ConflictError("A contact with this email already exists");
 */
export class ConflictError extends AppError {
    constructor(errorCode: ErrorCode = 'CONFLICT', params: Record<string, string> = {}) {
        super(errorCode, params);
    }
}
