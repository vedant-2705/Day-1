/**
 * @module RequestContext
 * @description Provides an `AsyncLocalStorage`-based request-scoped context store.
 *
 * `AsyncLocalStorage` propagates a value through an entire async call chain
 * (Promises, `await`, callbacks) without passing it explicitly through each function.
 * This allows any layer of the application - use cases, repositories, audit helpers -
 * to read the current request's `userId`, `ip`, `userAgent`, and `requestId` without
 * coupling every function signature to those values.
 *
 * Usage:
 *   - {@link requestContextMiddleware} calls `RequestContext.run(store, next)` once per request.
 *   - Downstream code reads the store via `RequestContext.getStore()`.
 */
import { AsyncLocalStorage } from "async_hooks";

/** Shape of the data stored for each in-flight request. */
export interface RequestContextStore {
    /** Authenticated user ID extracted from the JWT, or `'system'` for unauthenticated requests. */
    userId: string;

    /** Client IP address (direct socket or `X-Forwarded-For` from a proxy). */
    ip: string | null;

    /** Raw `User-Agent` header value. */
    userAgent: string | null;

    /**
     * UUID generated per request.
     * Used to correlate all log lines and audit entries that belong to the same request.
     */
    requestId: string;
}

/**
 * Singleton `AsyncLocalStorage` instance shared across the entire application.
 * Each request gets its own isolated store via `.run()`; stores never bleed across requests.
 */
export const RequestContext = new AsyncLocalStorage<RequestContextStore>();
