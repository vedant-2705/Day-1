/**
 * @module CursorPaginator
 * @description Utility class that implements keyset (cursor) pagination for Prisma queries.
 *
 * Cursor pagination is preferred over offset pagination for large, frequently updated
 * datasets because it maintains O(1) query performance regardless of page depth,
 * and avoids the "page drift" problem where rows shift between pages as data changes.
 *
 * Cursors are opaque base64url-encoded JSON tokens containing a composite
 * (createdAt, id) keyset. Clients treat them as black boxes - they only pass
 * the token back on the next request.
 */

import {
    CursorPayload,
    CursorPaginationParams,
    CursorPaginatedResult,
    SortField,
    SortDirection,
} from "./types.js";

export class CursorPaginator {
    // -------------------------------------------------------------------------
    // Cursor encode / decode
    // The cursor is a base64url-encoded JSON blob - opaque to the client.
    // Clients never inspect or construct cursors; they only pass them back.
    // -------------------------------------------------------------------------

    /**
     * Encodes a {@link CursorPayload} into an opaque base64url cursor token.
     * @param payload The composite keyset values (id + createdAt) to encode.
     * @returns A base64url string safe to include in a URL query parameter.
     */
    static encode(payload: CursorPayload): string {
        return Buffer.from(JSON.stringify(payload)).toString("base64url");
    }

    /**
     * Decodes a base64url cursor token back into a {@link CursorPayload}.
     * @param cursor The opaque cursor string received from the client.
     * @returns The decoded keyset payload.
     * @throws An error with an `INVALID_CURSOR` prefix if the token is malformed or tampered.
     */
    static decode(cursor: string): CursorPayload {
        try {
            const json = Buffer.from(cursor, "base64url").toString("utf-8");
            const parsed = JSON.parse(json);
            if (!parsed.id || !parsed.createdAt)
                throw new Error("Invalid shape");
            return parsed as CursorPayload;
        } catch {
            throw new Error(
                "INVALID_CURSOR: Cursor token is malformed or tampered",
            );
        }
    }

    // -------------------------------------------------------------------------
    // Prisma args builder
    // Produces { where, orderBy, take } to pass directly to Prisma.
    // The keyset WHERE clause replaces OFFSET entirely, keeping cost O(1).
    //
    // Why a composite keyset (createdAt, id)?:
    //   `createdAt` alone is not unique - multiple rows can share the same
    //   timestamp. Adding `id` as a tiebreaker makes the cursor position fully
    //   deterministic, preventing rows from being skipped or duplicated.
    //
    // The +1 probe trick:
    //   We fetch `limit + 1` rows. If we receive `limit + 1` back, there is a
    //   next page (hasNext = true). We strip the extra row before responding.
    //   This avoids a separate COUNT query, keeping pagination to a single DB hit.
    // -------------------------------------------------------------------------

    /**
     * Builds the Prisma `where`, `orderBy`, and `take` arguments for a cursor-paginated query.
     *
     * @param params Cursor pagination parameters including cursor token, limit, and direction.
     * @returns An object ready to spread into a Prisma `findMany` call.
     *
     * @remarks
     * For backward pagination the `ORDER BY` is flipped to `ASC`, and results are
     * re-reversed by {@link buildResult} to restore natural descending order before
     * returning to the client.
     */
    static getPrismaArgs(params: CursorPaginationParams): {
        where: object;
        orderBy: object[];
        take: number;
    } {
        console.log("Inside CursorPaginator Params: ", params);
        const { cursor, limit, direction = "forward", sort } = params;

        const baseSorts = sort ?? [{ field: 'createdAt', direction: 'desc' as const }];

        // For backward pagination, flip ORDER BY to ASC then re-reverse in buildResult
        const orientedSorts: SortField[] = direction === 'backward'
            ? baseSorts.map(s => ({
                field: s.field,
                direction: (s.direction === 'asc' ? 'desc' : 'asc') as SortDirection,
            }))
            : baseSorts;

        // id is always the final tiebreaker - same direction as last sort field
        const lastDir = orientedSorts[orientedSorts.length - 1]?.direction ?? 'desc';
        const effectiveSorts: SortField[] = [
            ...orientedSorts,
            { field: 'id', direction: lastDir },
        ];

        const orderBy = effectiveSorts.map(({ field, direction: dir }) => ({
            [field]: dir,
        }));

        // First page - no cursor provided, so no keyset WHERE condition is needed
        if (!cursor) {
            return { where: {}, orderBy, take: limit + 1 };
        }

        const decoded = CursorPaginator.decode(cursor);

        // Keyset WHERE condition - this is what makes cursor pagination O(1).
        // Forward:  return rows AFTER the cursor (older rows, given DESC order).
        // Backward: return rows BEFORE the cursor (newer rows, given flipped ASC order).
        // The OR/AND structure handles the composite (createdAt, id) tiebreaker correctly.
        // const cursorWhere =
        //     direction === "forward"
        //             ? {
        //                 OR: [
        //                     { createdAt: { lt: new Date(decoded.createdAt) } },
        //                     {
        //                         AND: [
        //                             {
        //                                 createdAt: {
        //                                     equals: new Date(decoded.createdAt),
        //                                 },
        //                             },
        //                             { id: { lt: decoded.id } },
        //                         ],
        //                     },
        //                 ],
        //             }
        //             : {
        //                 OR: [
        //                     { createdAt: { gt: new Date(decoded.createdAt) } },
        //                     {
        //                         AND: [
        //                             {
        //                                 createdAt: {
        //                                     equals: new Date(decoded.createdAt),
        //                                 },
        //                             },
        //                             { id: { gt: decoded.id } },
        //                         ],
        //                     },
        //                 ],
        //             };
        
        // Build keyset WHERE from the same effective sorts
        const cursorWhere = CursorPaginator.buildKeysetWhere(effectiveSorts, decoded);

        return { where: cursorWhere, orderBy, take: limit + 1 };
    }

    private static buildKeysetWhere(
        sorts: SortField[],
        cursor: CursorPayload,
    ): object {
        const orClauses: object[] = [];

        for (let i = 0; i < sorts.length; i++) {
            const andClauses: object[] = [];

            // All fields before i must equal their cursor value
            for (let j = 0; j < i; j++) {
                const { field } = sorts[j] as SortField;
                andClauses.push({
                    [field]: { equals: CursorPaginator.parseValue(field, cursor[field] as string) },
                });
            }

            // Field i must advance past its cursor value
            const { field, direction } = sorts[i] as SortField;
            const op = direction === 'asc' ? 'gt' : 'lt';
            andClauses.push({
                [field]: { [op]: CursorPaginator.parseValue(field, cursor[field] as string) },
            });

            orClauses.push(
                andClauses.length === 1
                    ? andClauses[0] as object
                    : { AND: andClauses },
            );
        }

        return orClauses.length === 1
            ? orClauses[0] as object
            : { OR: orClauses };
    }

    // Cursor stores all values as strings - convert Date fields back to Date objects
    private static parseValue(field: string, value: string): unknown {
        const dateFields = ['createdAt', 'updatedAt', 'deletedAt'];
        return dateFields.includes(field) ? new Date(value) : value;
    }


    /**
     * Builds an opaque cursor token from a result row's keyset fields.
     * @param row An object containing at minimum `id` and `createdAt`.
     * @returns A base64url cursor token representing the row's position in the result set.
     */
    static buildCursorFromRow(
        row: Record<string, unknown>,
        sort: SortField[]
    ): string {
        const payload: CursorPayload = { id: String(row['id']) };

        for (const { field } of sort) {
            if (field === 'id') continue;
            const value = row[field];
            payload[field] = value instanceof Date
                ? value.toISOString()
                : String(value ?? '');
        }

        return CursorPaginator.encode(payload);
    }

    /**
     * Applies the +1 probe result, constructs next/prev cursors, and returns the
     * final {@link CursorPaginatedResult} ready to send to the client.
     *
     * @param rows   Raw rows returned from Prisma, potentially containing the extra probe row.
     * @param params The original cursor pagination parameters used to fetch the rows.
     * @returns A paginated result with trimmed data and populated cursor metadata.
     */
    static buildResult<T extends { id: string; createdAt: Date }>(
        rows: T[],
        params: CursorPaginationParams,
    ): CursorPaginatedResult<T> {
        const { limit, direction = "forward", cursor, sort } = params;

        // If we received limit+1 rows, a further page exists in the current direction
        const hasMore = rows.length > limit;

        // Trim the extra probe row - the client only ever sees exactly `limit` rows
        const data = hasMore ? rows.slice(0, limit) : [...rows];

        // Backward pagination flipped ORDER BY to ASC, so re-reverse to restore
        // natural descending order before returning to the client
        if (direction === "backward") data.reverse();

        const firstRow = data[0];
        const lastRow = data[data.length - 1];

        // baseSorts = what SortBuilder resolved (user sort or default)
        // We use this for encoding — not the flipped version used for querying
        const baseSorts: SortField[] = sort ?? [{ field: 'createdAt', direction: 'desc' }];


        // nextCursor points to the last row of this page, used to fetch the NEXT forward page
        const nextCursor =
            hasMore && direction === "forward" && lastRow
                ? CursorPaginator.buildCursorFromRow(lastRow, baseSorts)
                : null;

        // prevCursor points to the first row of this page, used to fetch the PREVIOUS page
        const prevCursor =
            cursor && firstRow
                ? CursorPaginator.buildCursorFromRow(firstRow, baseSorts)
                : null;

        return {
            data,
            pagination: {
                nextCursor,
                prevCursor,
                hasNext: direction === "forward" ? hasMore : !!cursor,
                hasPrev: direction === "forward" ? !!cursor : hasMore,
                limit,
            },
        };
    }
}
