/**
 * @module OffsetPaginator
 * @description Utility class that implements offset (page/limit) pagination for Prisma queries.
 *
 * Offset pagination is straightforward and works well for small-to-medium datasets
 * or UIs that need to jump to an arbitrary page. For large datasets or real-time
 * feeds, prefer {@link CursorPaginator} to avoid performance degradation at high offsets.
 */

import {
    OffsetPaginationParams,
    OffsetPaginationMeta,
    OffsetPaginatedResult,
} from "./types.js";

export class OffsetPaginator {
    /**
     * Converts page/limit parameters into Prisma `skip`/`take` args.
     * @param params Offset pagination parameters containing `page` (1-based) and `limit`.
     * @returns An object with `skip` and `take` values ready to spread into a Prisma `findMany` call.
     */
    static getPrismaArgs(params: OffsetPaginationParams): {
        skip: number;
        take: number;
    } {
        return {
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        };
    }

    /**
     * Builds the pagination metadata from the total record count.
     * @param params Offset pagination parameters (page and limit).
     * @param total  Total number of records matching the query (from Prisma `count`).
     * @returns A fully populated {@link OffsetPaginationMeta} including `totalPages`, `hasNext`, and `hasPrev`.
     */
    static buildMeta(
        params: OffsetPaginationParams,
        total: number,
    ): OffsetPaginationMeta {
        const totalPages = Math.ceil(total / params.limit);
        return {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
        };
    }

    /**
     * Wraps the result data and pagination metadata into the final response shape.
     * @param data   The records for the current page.
     * @param params Offset pagination parameters used for the query.
     * @param total  Total number of records matching the query.
     * @returns An {@link OffsetPaginatedResult} ready to return from the repository.
     */
    static buildResult<T>(
        data: T[],
        params: OffsetPaginationParams,
        total: number,
    ): OffsetPaginatedResult<T> {
        return {
            data,
            pagination: this.buildMeta(params, total),
        };
    }
}
