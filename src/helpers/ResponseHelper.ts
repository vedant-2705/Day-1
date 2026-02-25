/**
 * @module ResponseHelper
 * @description Utility functions for building consistent JSON API responses.
 * All endpoints use these helpers so clients can rely on a uniform response envelope.
 */

import { randomUUID } from "node:crypto";

const BASE_ERROR_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

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
            ...meta,
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
export const errorResponse = (
    code: string,
    detail: string,
    errors?: unknown,
    instance?: string,
) => ({
    type: `${BASE_ERROR_URL}/errors/${code}`,
    title: code
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" "),
    status: undefined as number | undefined,
    detail,
    instance: instance ?? "/",
    code,
    traceId: randomUUID(),
    ...(errors ? { errors } : {}),
});