/**
 * @module SoftDeleteExtension
 * @description Prisma client extension that transparently enforces soft-delete filtering
 * on all read operations for the `contact` model.
 *
 * Instead of physically removing rows, the application marks deleted records by
 * setting a `deletedAt` timestamp. This extension automatically injects
 * `deletedAt: null` into every read query so that soft-deleted records are
 * excluded from results by default, without requiring every call-site to remember
 * to add the filter manually.
 *
 * Callers that intentionally need to include archived records can override the
 * filter by explicitly providing a `deletedAt` condition in their query args.
 */

import { Prisma } from "generated/prisma/client.js";
import { Logger } from "logging/Logger.js";

/**
 * Read operations that should have the soft-delete filter automatically applied.
 * Write operations and `findUnique` are excluded because they operate on specific
 * records by primary key and do not need blanket exclusion of deleted rows.
 */
const READ_OPS = ["findMany", "findFirst", "count", "aggregate"];

/**
 * Creates a Prisma client extension that automatically filters out soft-deleted
 * records on read operations for the `contact` model.
 *
 * @param logger - Application logger used to emit debug-level query traces.
 * @returns A Prisma extension that can be chained with `.$extends()`.
 *
 * @remarks
 * The filter is applied with a "default but overridable" strategy:
 * - If the caller has not supplied a `deletedAt` condition, `deletedAt: null`
 *   is injected automatically, hiding archived records.
 * - If the caller explicitly provides a `deletedAt` condition (e.g. to query
 *   the archive), that value is respected and the default is not applied.
 */
export function createSoftDeleteExtension(logger: Logger) {
    return Prisma.defineExtension((client) => {
        return client.$extends({
            query: {
                contact: {
                    async $allOperations({ model, operation, args, query }) {
                        if (READ_OPS.includes(operation)) {
                            const readArgs = args as {
                                where?: Record<string, unknown>;
                            };

                            // Inject `deletedAt: null` only when the caller has not
                            // already specified a deletedAt filter, preserving the
                            // ability to intentionally query soft-deleted records.
                            readArgs.where = {
                                ...readArgs.where,
                                deletedAt:
                                    readArgs.where?.deletedAt !== undefined
                                        ? readArgs.where.deletedAt
                                        : null,
                            };
                        }

                        logger.debug(`Executing ${model}.${operation} with args:`, args);
                        return query(args);
                    },
                },
            },
        });
    });
}
