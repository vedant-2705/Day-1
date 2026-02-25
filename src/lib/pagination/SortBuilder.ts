/**
 * @module SortBuilder
 * @description Utility class for safely parsing and transforming sort parameters
 * from client query strings into Prisma-compatible `orderBy` arrays.
 *
 * Client-supplied field names are validated against an explicit allowlist before
 * being passed to the database, preventing field enumeration and injection attacks.
 */

import { SortDirection, SortField } from "./types.js";

/**
 * Allowlist of fields the client is permitted to sort on, mapped to their Prisma field names.
 *
 * @remarks
 * Never pass raw client-supplied field names directly to Prisma.
 * Any field name not present in this map is silently dropped by {@link SortBuilder.parse},
 * ensuring no internal schema details are exposed or exploited.
 */
const ALLOWED_SORT_FIELDS: Record<string, string> = {
    name: "name",
    email: "email",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
};

/** Default sort applied when no valid sort parameter is provided: newest records first. */
const DEFAULT_SORT: SortField[] = [{ field: "createdAt", direction: "desc" }];

export class SortBuilder {
    /**
     * Parses a comma-separated sort query string into a {@link SortField} array.
     *
     * @param sortParam - Raw sort string from the query parameter, e.g. `"name:asc,createdAt:desc"`.
     * @returns An array of validated sort fields ready for {@link toPrismaOrderBy}.
     *
     * @remarks
     * - Fields not present in {@link ALLOWED_SORT_FIELDS} are silently dropped rather than
     *   throwing, making it safe to pass raw client input without prior sanitisation.
     * - If no valid fields remain after filtering, {@link DEFAULT_SORT} is returned.
     * - Direction defaults to `"desc"` for any unrecognised or missing direction value.
     */
    static parse(sortParam?: string): SortField[] {
        if (!sortParam?.trim()) return DEFAULT_SORT;

        const fields = sortParam
            .split(",")
            .map((part) => {
                const [rawField, rawDir] = part.trim().split(":");
                const field = ALLOWED_SORT_FIELDS[rawField];
                const direction: SortDirection =
                    rawDir?.toLowerCase() === "asc" ? "asc" : "desc";

                // Drops unrecognised fields silently
                if (!field) return null;

                return { field, direction };
            })
            .filter((f): f is SortField => f !== null);

        return fields.length > 0 ? fields : DEFAULT_SORT;
    }

    /**
     * Converts a {@link SortField} array into a Prisma `orderBy` array.
     *
     * @param fields - Sort fields produced by {@link parse}.
     * @returns An array of `{ [fieldName]: direction }` objects for use in `findMany({ orderBy })`.
     *
     * @example
     * SortBuilder.toPrismaOrderBy([{ field: 'name', direction: 'asc' }])
     * // => [{ name: 'asc' }]
     */
    static toPrismaOrderBy(
        fields: SortField[],
    ): Record<string, SortDirection>[] {
        return fields.map(({ field, direction }) => ({ [field]: direction }));
    }
}
