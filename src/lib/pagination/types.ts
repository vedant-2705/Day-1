/**
 * @module types
 * @description Shared type definitions for the pagination layer.
 * Covers both offset-based and cursor-based pagination strategies,
 * as well as the unified {@link ContactQueryParams} used by v2 endpoints.
 */

/** Sort direction for query results. */
export type SortDirection = "asc" | "desc";

/**
 * Represents a single sort criterion.
 * @property field     - The Prisma model field name to sort by.
 * @property direction - The sort direction: ascending or descending.
 */
export interface SortField {
    field: string;
    direction: SortDirection;
}

// ---------------------------------------------------------------------------
// Offset pagination - page/limit based; suitable for navigable page UIs
// ---------------------------------------------------------------------------

/**
 * Input parameters for an offset-paginated query.
 * @property page  - 1-based page number.
 * @property limit - Number of records per page.
 */
export interface OffsetPaginationParams {
    page: number;
    limit: number;
}

/**
 * Metadata returned alongside offset-paginated results.
 * Provides all information needed for a client to render a paginator UI.
 */
export interface OffsetPaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/** Wraps a page of results with its corresponding offset pagination metadata. */
export interface OffsetPaginatedResult<T> {
    data: T[];
    pagination: OffsetPaginationMeta;
}

// ---------------------------------------------------------------------------
// Cursor pagination - keyset based; O(1) regardless of dataset size
// ---------------------------------------------------------------------------

/**
 * The decoded payload embedded inside a base64url cursor token.
 * Uses a composite (createdAt, id) keyset to guarantee deterministic ordering
 * even when multiple rows share the same timestamp.
 */
export interface CursorPayload {
    id: string;
    [key: string]: string;
}

/**
 * Input parameters for a cursor-paginated query.
 * @property cursor    - Opaque cursor token from the previous page response; omit for the first page.
 * @property limit     - Maximum number of records to return per page.
 * @property direction - `"forward"` (default) traverses newer -> older; `"backward"` reverses traversal.
 */
export interface CursorPaginationParams {
    cursor?: string;
    limit: number;
    direction?: "forward" | "backward";
    // Optional sort criteria; if omitted, defaults to [{ field: 'createdAt', direction: 'desc' }]
    sort?: SortField[]; 
}

/** Metadata returned alongside cursor-paginated results. */
export interface CursorPaginationMeta {
    nextCursor: string | null;
    prevCursor: string | null;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
}

/** Wraps a page of results with its corresponding cursor pagination metadata. */
export interface CursorPaginatedResult<T> {
    data: T[];
    pagination: CursorPaginationMeta;
}

// ---------------------------------------------------------------------------
// Combined query params - unified input for v2 getAll contact queries
// ---------------------------------------------------------------------------

/**
 * Unified query parameters parsed from `req.query` by the v2 contact controller.
 * Passed down through the use-case and repository layers without modification,
 * keeping each layer ignorant of HTTP concerns.
 *
 * @remarks
 * - `search` performs a fuzzy match across both `name` and `email` simultaneously.
 * - `name` / `email` are exact field-level filters applied independently.
 * - `sort` is pre-parsed by {@link SortBuilder} before being placed on this object.
 * - `paginationType` selects which pagination strategy the repository uses;
 *   defaults to `"cursor"` if omitted.
 */
export interface ContactQueryParams {
    /** Fuzzy match applied across `name` AND `email` fields simultaneously. */
    search?: string;

    // ---- Exact field-level filters ----
    /** Exact match filter on the contact's full name. */
    name?: string;
    /** Exact match filter on the contact's email address. */
    email?: string;

    /** Pre-parsed sort criteria. Use {@link SortBuilder.parse} to build this from a raw query string. */
    sort?: SortField[];

    /** Selects the pagination strategy. Defaults to `"cursor"` when omitted. */
    paginationType?: "offset" | "cursor";

    // ---- Offset pagination params (used when paginationType="offset") ----
    /** 1-based page number. */
    page?: number;
    /** Maximum records per page. */
    limit?: number;

    // ---- Cursor pagination params (used when paginationType="cursor", the default) ----
    /** Opaque cursor token from the previous page response. Omit for the first page. */
    cursor?: string;
    /** Traversal direction. `"forward"` (default) moves toward older records; `"backward"` reverses. */
    direction?: "forward" | "backward";

    /** Injected by use case for USER role */
    createdBy?: string;
}
