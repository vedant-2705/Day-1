import { StatusCodes, ReasonPhrases } from "http-status-codes";

export interface ErrorDefinition {
    code: string;
    statusCode: number;
    title: string;
    message: string;
}

export const ERROR_CODES = {
    // Generic 
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

    // Pagination 
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

    // Contact 
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
} as const;

export function formatMessage(
    template: string,
    params: Record<string, string> = {},
): string {
    return template.replace(
        /\{(\w+)\}/g,
        (_, key) => params[key] ?? `{${key}}`,
    );
}

export type ErrorCode = keyof typeof ERROR_CODES;
