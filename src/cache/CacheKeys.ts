/**
 * @module CacheKeys
 * @description Centralized cache key builders and TTL constants.
 * All cache keys are defined here to avoid magic strings scattered across use cases.
 *
 * Key namespacing strategy:
 *   - Contact lists   -> "contacts:user:{userId}:..." (scoped per user for ownership isolation)
 *   - Single contact  -> "contact:single:{contactId}" (global - ownership validated in use case)
 *   - Stats           -> "stats:contacts:summary"
 */

export interface ContactListCacheParams {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortDir?: string;
    cursor?: string;
}

export const CacheKeys = {
    /**
     * List cache key - encodes all dimensions that affect the result set.
     * Any change to filters/sort/pagination produces a distinct key.
     */
    contactList: (
        userId: string,
        params: ContactListCacheParams
    ): string => {
        const parts = [
            `contacts:user:${userId}`,
            `page:${params.page ?? 1}`,
            `limit:${params.limit ?? 10}`,
            `search:${params.search ?? "__none__"}`,
            `sort:${params.sortField ?? "createdAt"}:${params.sortDir ?? "asc"}`,
            `cursor:${params.cursor ?? "__none__"}`,
        ];
        return parts.join(":");
    },

    /**
     * Single contact key - shared across users (contact ID is globally unique).
     * IMPORTANT: ownership must be validated in the use case, not the cache layer.
     */
    contactById: (contactId: string): string => `contact:single:${contactId}`,

    /**
     * Wildcard pattern for invalidating ALL list caches for a given user.
     * Used after any write operation (create / update / delete).
     */
    contactListPattern: (userId: string): string => `contacts:user:${userId}:*`,

    /** Stats key for the SSE stats endpoint. */
    contactStats: (): string => `stats:contacts:summary`,
};

/** TTL constants in seconds. */
export const CacheTTL = {
    /** 1 minute - list result changes on any write; short TTL keeps data fresh. */
    CONTACT_LIST: 60,

    /** 2 minutes - single contact is stable until explicitly edited. */
    CONTACT_SINGLE: 120,

    /** 10 seconds - live stats stream via SSE; short enough to feel real-time. */
    CONTACT_STATS: 10,
} as const;
