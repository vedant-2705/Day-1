import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError.js";

/**
 * Thrown when a request conflicts with the current state of a resource.
 * Maps to HTTP 409 Conflict.
 *
 * @example
 * // Duplicate email on contact creation
 * throw new ConflictError("A contact with this email already exists");
 */
export class ConflictError extends AppError {
    constructor(message: string, details?: any) {
        super(message, StatusCodes.CONFLICT, "CONFLICT", details);
    }
}
