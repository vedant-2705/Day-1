/**
 * @module ErrorCodes
 * @description Centralised catalogue of all application error definitions.
 * Each entry maps a semantic error code to its HTTP status, human-readable title,
 * and a default message that may contain interpolation placeholders (e.g. `{id}`).
 * Consumers should use {@link formatMessage} to resolve placeholders before
 * returning the message to a client.
 */

import { StatusCodes, ReasonPhrases } from "http-status-codes";

/**
 * Represents the shape of a single error definition.
 *
 * @property code       - Machine-readable identifier used in API responses.
 * @property statusCode - HTTP status code to send with the response.
 * @property title      - Short, human-readable label for the error category.
 * @property message    - Default error message; may contain `{placeholder}` tokens.
 */
export interface ErrorDefinition {
    code: string;
    statusCode: number;
    title: string;
    message: string;
}

/**
 * Exhaustive map of all error codes used across the application.
 *
 * @remarks
 * Declared `as const` so TypeScript narrows each entry to its literal types,
 * enabling type-safe lookups via {@link ErrorCode}.
 * Errors are grouped by domain: generic HTTP errors, pagination errors,
 * and entity-specific errors (e.g. Contact).
 */
export const ERROR_CODES = {
    // -------------------------------------------------------------------------
    // Generic HTTP errors - used when no domain-specific code applies
    // -------------------------------------------------------------------------
    INTERNAL_SERVER_ERROR: {
        code: "INTERNAL_SERVER_ERROR",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR, 
        title: ReasonPhrases.INTERNAL_SERVER_ERROR, 
        message: "An unexpected error occurred",
    },
    VALIDATION_FAILED: {
        code: "VALIDATION_FAILED",
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        title: ReasonPhrases.UNPROCESSABLE_ENTITY, 
        message: "The request body contains invalid data",
    },
    NOT_FOUND: {
        code: "NOT_FOUND",
        statusCode: StatusCodes.NOT_FOUND, 
        title: ReasonPhrases.NOT_FOUND, 
        message: "The requested resource was not found",
    },
    CONFLICT: {
        code: "CONFLICT",
        statusCode: StatusCodes.CONFLICT,
        title: ReasonPhrases.CONFLICT, 
        message: "A resource with this value already exists",
    },
    BAD_REQUEST: {
        code: "BAD_REQUEST",
        statusCode: StatusCodes.BAD_REQUEST,
        title: ReasonPhrases.BAD_REQUEST, 
        message: "The request is malformed or missing required fields",
    },
    UNAUTHORIZED: {
        code: "UNAUTHORIZED",
        statusCode: StatusCodes.UNAUTHORIZED,
        title: ReasonPhrases.UNAUTHORIZED, 
        message: "Authentication is required",
    },
    FORBIDDEN: {
        code: "FORBIDDEN",
        statusCode: StatusCodes.FORBIDDEN,
        title: ReasonPhrases.FORBIDDEN, 
        message: "You do not have permission to perform this action",
    },

    // -------------------------------------------------------------------------
    // Pagination & versioning errors - raised during request routing/pagination
    // -------------------------------------------------------------------------
    UNSUPPORTED_VERSION: {
        code: "UNSUPPORTED_VERSION",
        statusCode: StatusCodes.BAD_REQUEST,
        title: ReasonPhrases.BAD_REQUEST,
        message: "The requested API version is not supported",
    },
    INVALID_CURSOR: {
        code: "INVALID_CURSOR",
        statusCode: StatusCodes.BAD_REQUEST,
        title: ReasonPhrases.BAD_REQUEST,
        message: "The pagination cursor is malformed or expired",
    },

    // -------------------------------------------------------------------------
    // Contact domain errors - specific to contact resource operations
    // -------------------------------------------------------------------------
    CONTACT_NOT_FOUND: {
        code: "CONTACT_NOT_FOUND",
        statusCode: StatusCodes.NOT_FOUND,
        title: ReasonPhrases.NOT_FOUND,
        message: "Contact with id '{id}' was not found",
    },
    CONTACT_EMAIL_CONFLICT: {
        code: "CONTACT_EMAIL_CONFLICT",
        statusCode: StatusCodes.CONFLICT,
        title: ReasonPhrases.CONFLICT,
        message: "A contact with email '{email}' already exists",
    },

    // -------------------------------------------------------------------------
    // User domain errors - specific to user/resource operations
    // -------------------------------------------------------------------------
    USER_EMAIL_TAKEN: {
        code:       'USER_EMAIL_TAKEN',
        statusCode: StatusCodes.CONFLICT,
        title:      ReasonPhrases.CONFLICT,
        message:    "An account with email '{email}' already exists",
    },
    USER_NOT_FOUND: {
        code:       'USER_NOT_FOUND',
        statusCode: StatusCodes.NOT_FOUND,
        title:      ReasonPhrases.NOT_FOUND,
        message:    "User with id '{id}' was not found",
    },
    INVALID_CREDENTIALS: {
        code:       'INVALID_CREDENTIALS',
        statusCode: StatusCodes.UNAUTHORIZED,
        title:      ReasonPhrases.UNAUTHORIZED,
        message:    "Invalid email or password",
    },
    INVALID_TOKEN: {
        code:       'INVALID_TOKEN',
        statusCode: StatusCodes.UNAUTHORIZED,
        title:      ReasonPhrases.UNAUTHORIZED,
        message:    "Token is invalid or has expired",
    },
    TOKEN_REUSE_DETECTED: {
        code:       'TOKEN_REUSE_DETECTED',
        statusCode: StatusCodes.UNAUTHORIZED,
        title:      ReasonPhrases.UNAUTHORIZED,
        message:    "Security violation detected. All sessions have been invalidated",
    },
    INSUFFICIENT_PERMISSIONS: {
        code:       'INSUFFICIENT_PERMISSIONS',
        statusCode: StatusCodes.FORBIDDEN,
        title:      ReasonPhrases.FORBIDDEN,
        message:    "You do not have permission to perform this action",
},
} as const;

/**
 * Resolves `{placeholder}` tokens in an error message template.
 *
 * @param template - The raw message string containing zero or more `{key}` tokens.
 * @param params   - Key/value pairs used to replace matching tokens in the template.
 * @returns The resolved message with all known placeholders substituted.
 *          Any token without a matching key is left as-is (e.g. `{id}`).
 *
 * @example
 * formatMessage("Contact with id '{id}' was not found", { id: "42" });
 * // => "Contact with id '42' was not found"
 */
export function formatMessage(
    template: string,
    params: Record<string, string> = {},
): string {
    return template.replace(
        /\{(\w+)\}/g,
        (_, key) => params[key] ?? `{${key}}`,
    );
}

/** Union type of all valid error code keys, derived directly from {@link ERROR_CODES}. */
export type ErrorCode = keyof typeof ERROR_CODES;
