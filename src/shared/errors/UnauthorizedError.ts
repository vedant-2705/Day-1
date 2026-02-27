/**
 * @module UnauthorizedError
 * @description Represents an HTTP 401 Unauthorized error.
 *
 * Thrown when a request cannot be authenticated - the access token is missing,
 * expired, or has an invalid signature. Use this (not {@link ForbiddenError})
 * when the caller's identity cannot be established.
 *
 * 401 Unauthorized  = we don't know who you are (missing/invalid token).
 * 403 Forbidden     = we know who you are, but you can't do this.
 */
import { ErrorCode } from 'constants/ErrorCodes.js';
import { AppError }  from './AppError.js';

export class UnauthorizedError extends AppError {
    constructor(code: ErrorCode) {
        super(code);
    }
}