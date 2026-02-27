/**
 * @module paginationValidator
 * @description Zod schemas for validating and coercing pagination-related query parameters.
 *
 * All query parameters arrive as raw strings from `req.query`. Each schema uses
 * `.transform()` + `.pipe()` to coerce strings to numbers and apply range constraints
 * in a single step, so controllers always receive correctly typed values.
 *
 * Three schemas are exported:
 * - {@link offsetPaginationSchema} - page/limit validation for offset pagination.
 * - {@link cursorPaginationSchema} - cursor/limit/direction for cursor pagination.
 * - {@link contactQuerySchema} - full v2 query schema combining search, filters, sort, and pagination.
 */

import { z } from "zod";

/** Maximum number of records a client may request in a single page. */
const MAX_LIMIT = 100;

/** Default number of records returned per page when `limit` is not provided. */
const DEFAULT_LIMIT = 10;

/** Default page number used when `page` is not provided. */
const DEFAULT_PAGE = 1;

// ---------------------------------------------------------------------------
// Offset pagination schema
// ---------------------------------------------------------------------------

/**
 * Validates and coerces query parameters for offset-based pagination.
 * Both `page` and `limit` are optional strings that are parsed to integers
 * and validated against minimum/maximum bounds.
 */
export const offsetPaginationSchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : DEFAULT_PAGE))
        .pipe(z.number().int().min(1, "Page must be at least 1")),

    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : DEFAULT_LIMIT))
        .pipe(
            z
                .number()
                .int()
                .min(1)
                .max(MAX_LIMIT, `Limit cannot exceed ${MAX_LIMIT}`),
        ),
});

// ---------------------------------------------------------------------------
// Cursor pagination schema
// ---------------------------------------------------------------------------

/**
 * Validates and coerces query parameters for cursor-based pagination.
 * `cursor` is an opaque string token from a previous response; omit it for the first page.
 * `direction` defaults to `"forward"` if not provided.
 */
export const cursorPaginationSchema = z.object({
    cursor: z.string().optional(),

    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : DEFAULT_LIMIT))
        .pipe(
            z
                .number()
                .int()
                .min(1)
                .max(MAX_LIMIT, `Limit cannot exceed ${MAX_LIMIT}`),
        ),

    direction: z.enum(["forward", "backward"]).optional().default("forward"),
});

// ---------------------------------------------------------------------------
// Full v2 contact query schema
// ---------------------------------------------------------------------------

/**
 * Full validation schema for the v2 `GET /contacts` endpoint.
 * Validates and coerces every query parameter the endpoint accepts:
 * search, field filters, sort string, pagination mode, and pagination params.
 *
 * @remarks
 * - `email` is lowercased automatically to normalise input before filtering.
 * - `sort` is left as a raw string here; {@link SortBuilder.parse} handles
 *   further parsing and allowlist validation downstream.
 * - `paginationType` defaults to `"cursor"` - the preferred strategy for v2.
 * - `direction` defaults to `"forward"` when not provided.
 */
export const contactQuerySchema = z.object({
    // ---- Search ----
    /** Case-insensitive fuzzy match applied across both `name` and `email`. */
    search: z.string().trim().optional(),

    // ---- Field-level filters ----
    /** Case-insensitive substring filter on the contact's name. */
    name: z.string().trim().optional(),
    /** Case-insensitive substring filter on the contact's email; lowercased automatically. */
    email: z.string().trim().toLowerCase().optional(),

    // ---- Sort ----
    /** Raw sort string (e.g. `"name:asc,createdAt:desc"`); parsed by SortBuilder downstream. */
    sort: z.string().optional(),

    // ---- Pagination mode ----
    /** Selects the pagination strategy. Defaults to `"cursor"`. */
    paginationType: z.enum(["offset", "cursor"]).optional().default("cursor"),

    // ---- Offset pagination fields ----
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1))
        .pipe(z.number().int().min(1)),

    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 10))
        .pipe(z.number().int().min(1).max(MAX_LIMIT)),

    // ---- Cursor pagination fields ----
    /** Opaque cursor token from a previous page response. Omit for the first page. */
    cursor: z.string().optional(),

    /** Traversal direction. Defaults to `"forward"`. */
    direction: z.enum(["forward", "backward"]).optional().default("forward"),
});

export type ContactQueryInput = z.infer<typeof contactQuerySchema>;
