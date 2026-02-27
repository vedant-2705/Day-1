/**
 * @module ForbiddenError
 * @description Represents an HTTP 403 Forbidden error.
 *
 * Thrown when the authenticated user's role does not grant access to the
 * requested resource or action. Use this (not {@link UnauthorizedError}) when
 * the caller's identity is known but their permissions are insufficient.
 *
 * 401 Unauthorized  = we don't know who you are (missing/invalid token).
 * 403 Forbidden     = we know who you are, but you can't do this.
 */
import { ErrorCode } from 'constants/ErrorCodes.js';
import { AppError }  from './AppError.js';

export class ForbiddenError extends AppError {
    constructor(code: ErrorCode) {
        super(code);
    }
}