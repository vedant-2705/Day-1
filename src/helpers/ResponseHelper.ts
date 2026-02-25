/**
 * @module ResponseHelper
 * @description Utility functions for building consistent JSON API responses.
 * All endpoints use these helpers so clients can rely on a uniform response envelope.
 */

import { randomUUID } from "node:crypto";

/** Base URL used as a namespace prefix for error type URIs (e.g. `http://localhost:3000/errors/NOT_FOUND`). */
const BASE_ERROR_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

/**
 * Represents the RFC 7807-inspired error response envelope returned by all API error paths.
 *
 * @property type      - URI that identifies the error type; clients can dereference it for documentation.
 * @property title     - Human-readable, title-cased label derived from the error code.
 * @property status    - HTTP status code mirrored in the body for client convenience; set by the error handler.
 * @property detail    - Human-readable explanation of the specific error instance.
 * @property instance  - The request path that triggered the error.
 * @property code      - Machine-readable error code (e.g. `"NOT_FOUND"`, `"VALIDATION_ERROR"`).
 * @property traceId   - Unique UUID generated per response to correlate client reports with server logs.
 * @property errors    - Optional structured validation details (e.g. Zod field-level issues).
 */
export interface ErrorResponseBody {
    type: string;
    title: string;
    status: number | undefined;
    detail: string;
    instance: string;
    code: string;
    traceId: string;
    errors?: unknown;
}

/** Envelope shape used for all API responses - both success and error paths. */
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
 * Builds an error response envelope conforming to {@link ErrorResponseBody}.
 *
 * @param code     - Machine-readable error code (e.g. `"NOT_FOUND"`, `"VALIDATION_ERROR"`).
 * @param detail   - Human-readable description of the specific error instance.
 * @param errors   - Optional structured validation details (e.g. Zod prettified issues).
 * @param instance - The request path that triggered the error; defaults to `"/"` if omitted.
 * @returns A populated {@link ErrorResponseBody} ready to be passed to `res.json()`.
 */
export const errorResponse = (
    code: string,
    detail: string,
    errors?: unknown,
    instance?: string,
): ErrorResponseBody => ({
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