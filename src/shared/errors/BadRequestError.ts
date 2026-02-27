import { ErrorCode } from "constants/ErrorCodes.js";
import { AppError } from "./AppError.js";

/**
 * Thrown when the request is valid JSON but semantically incorrect.
 * Maps to HTTP 400 Bad Request.
 *
 * @example
 * throw new BadRequestError(ErrorKeys.SAME_PASSWORD);
 */
export class BadRequestError extends AppError {
    constructor(
        errorCode: ErrorCode = "BAD_REQUEST",
        params: Record<string, string> = {},
    ) {
        super(errorCode, params);
    }
}
