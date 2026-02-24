/**
 * @module ResponseHelper
 * @description Utility functions for building consistent JSON API responses.
 * All endpoints use these helpers so clients can rely on a uniform response envelope.
 */

/** Envelope shape used for all API responses - both success and error. */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

/**
 * Builds a success response envelope.
 * @param data The payload to return to the client
 * @param meta Optional extra metadata (e.g. pagination info) merged into the `meta` field
 * @returns A populated {@link ApiResponse} with `success: true`
 */
export function successResponse<T>(
    data: T,
    meta?: Record<string, unknown>,
): ApiResponse<T> {
    return {
        success: true,
        data,
        meta: { 
            timestamp: new Date().toISOString(), 
            ...meta 
        },
    };
}

/**
 * Builds an error response envelope.
 * @param code Machine-readable error code (e.g. `"NOT_FOUND"`, `"VALIDATION_ERROR"`)
 * @param message Human-readable description of the error
 * @param details Optional structured details (e.g. Zod validation issues)
 * @returns A populated {@link ApiResponse} with `success: false`
 */
export function errorResponse(
    code: string,
    message: string,
    details?: unknown,
): ApiResponse<never> {
    return {
        success: false,
        error: { 
            code, 
            message, 
            ...(details !== undefined && { details }) 
        },
        meta: { timestamp: new Date().toISOString() },
    };
}
