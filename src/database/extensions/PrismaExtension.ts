/**
 * @module PrismaExtension
 * @description Prisma client extension that automatically records an audit log entry
 * for every write operation (create, update, delete, updateMany, deleteMany) performed
 * on any model listed in {@link AUDITED_MODELS}.
 *
 * Audit entries are written using the raw (non-extended) Prisma client to avoid
 * infinite recursion that would occur if the extended client intercepted its own
 * audit log writes. Failures are logged but never rethrow, so an audit write
 * failure will never block or roll back the originating operation.
 */

import { Prisma } from "generated/prisma/client.js";
import { Logger } from "logging/Logger.js";

/**
 * Registry of Prisma model names that should be audit-logged.
 * The value is the primary key field name used to identify the entity in log entries.
 * Add any new model here to opt it into automatic audit tracking.
 */
const AUDITED_MODELS: Record<string, string> = {
    Contact: "id",
};

/**
 * Prisma operations that mutate data and therefore require an audit log entry.
 * Read operations (findMany, findUnique, etc.) are intentionally excluded.
 */
const WRITE_OPS = ["create", "update", "delete", "updateMany", "deleteMany"];

/**
 * Creates a Prisma client extension that intercepts all write operations on
 * audited models and persists a corresponding {@link AuditLog} record.
 *
 * @param logger - Application logger used to report audit write failures.
 * @returns A Prisma extension that can be chained with `.$extends()`.
 *
 * @remarks
 * - Only models listed in {@link AUDITED_MODELS} are audited; all other models
 *   pass through unchanged.
 * - For `update` operations, the pre-mutation snapshot is fetched first so both
 *   `oldData` and `newData` are captured in the log.
 * - For `updateMany` / `deleteMany`, individual snapshots are not feasible;
 *   the filter criteria are stored instead.
 * - Audit log writes are fire-and-forget (`.catch` only) to prevent an audit
 *   failure from disrupting the originating business transaction.
 */
export function createAuditExtension(logger: Logger) {
    return Prisma.defineExtension((client) => {
        return client.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        // Skip models that are not registered for auditing,
                        // and skip non-mutating operations (reads, aggregations, etc.)
                        if (
                            !model ||
                            !AUDITED_MODELS[model] ||
                            !WRITE_OPS.includes(operation)
                        ) {
                            return query(args);
                        }

                        const idField = AUDITED_MODELS[model];
                        const modelAccessor =
                            model.charAt(0).toLowerCase() + model.slice(1);

                        // -------------------------------------------------------------
                        // CREATE - run the query first, then log the created record
                        // -------------------------------------------------------------
                        if (operation === "create") {
                            const result = (await query(args)) as Record<
                                string,
                                unknown
                            >;

                            // Write the audit log using the RAW (non-extended) client.
                            // Using the extended client here would cause infinite recursion
                            // because this very interceptor would fire again on the audit write.
                            client.auditLog
                                .create({
                                    data: {
                                        entityType: model,
                                        entityId: String(result[idField]),
                                        action: "CREATE",
                                        newData: result,
                                        performedBy: "system",
                                    },
                                })
                                .catch((err: unknown) =>
                                    logger.error(
                                        "[Audit] Failed to log CREATE",
                                        err,
                                    ),
                                );

                            return result;
                        }

                        // -------------------------------------------------------------
                        // UPDATE - capture the before-state, run the query, then log both
                        // -------------------------------------------------------------
                        if (operation === "update") {
                            const typedArgs = args as {
                                where: Record<string, unknown>;
                                data: Record<string, unknown>;
                            };

                            // Treat an update that sets `deletedAt` as a logical DELETE
                            // so the audit log accurately reflects the intent of the operation.
                            const isSoftDelete =
                                typedArgs.data?.deletedAt !== undefined &&
                                typedArgs.data?.deletedAt !== null;

                            // Fetch the current record BEFORE the mutation so we can
                            // store a full before/after diff in the audit log entry.
                            const oldData = await (client as any)[
                                modelAccessor
                            ].findUnique({
                                where: typedArgs.where,
                            });

                            const result = (await query(args)) as Record<
                                string,
                                unknown
                            >;

                            client.auditLog
                                .create({
                                    data: {
                                        entityType: model,
                                        entityId: String(result[idField]),
                                        action: isSoftDelete ? "DELETE" : "UPDATE",
                                        oldData: oldData ?? undefined,
                                        newData: result,
                                        performedBy: "system",
                                    },
                                })
                                .catch((err: unknown) =>
                                    logger.error(
                                        "[Audit] Failed to log UPDATE",
                                        err,
                                    ),
                                );

                            return result;
                        }

                        // -------------------------------------------------------------
                        // DELETE - capture the record before removal, then log it
                        // -------------------------------------------------------------
                        if (operation === "delete") {
                            const typedArgs = args as {
                                where: Record<string, unknown>;
                            };

                            const oldData = await (client as any)[
                                modelAccessor
                            ].findUnique({
                                where: typedArgs.where,
                            });

                            const result = (await query(args)) as Record<
                                string,
                                unknown
                            >;

                            client.auditLog
                                .create({
                                    data: {
                                        entityType: model,
                                        entityId: oldData
                                            ? String(oldData[idField])
                                            : "unknown",
                                        action: "DELETE",
                                        oldData: oldData ?? undefined,
                                        performedBy: "system",
                                    },
                                })
                                .catch((err: unknown) =>
                                    logger.error(
                                        "[Audit] Failed to log DELETE",
                                        err,
                                    ),
                                );

                            return result;
                        }

                        // -------------------------------------------------------------
                        // updateMany / deleteMany - individual snapshots are not feasible
                        // for bulk ops; store the filter criteria as context instead
                        // -------------------------------------------------------------
                        if (
                            operation === "updateMany" ||
                            operation === "deleteMany"
                        ) {
                            const result = await query(args);

                            client.auditLog
                                .create({
                                    data: {
                                        entityType: model,
                                        entityId: "bulk",
                                        action:
                                            operation === "updateMany"
                                                ? "UPDATE"
                                                : "DELETE",
                                        oldData: { where: (args as any).where },
                                        newData:
                                            operation === "updateMany"
                                                ? { data: (args as any).data }
                                                : undefined,
                                        performedBy: "system",
                                    },
                                })
                                .catch((err: unknown) =>
                                    logger.error(
                                        "[Audit] Failed to log bulk op",
                                        err,
                                    ),
                                );

                            return result;
                        }

                        return query(args);
                    },
                },
            },
        });
    });
}
