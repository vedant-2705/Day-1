import { Prisma } from "generated/prisma/client.js";
import { Logger } from "logging/Logger.js";

// Models to audit → map to their id field
const AUDITED_MODELS: Record<string, string> = {
    Contact: "id",
};

const WRITE_OPS = ["create", "update", "delete", "updateMany", "deleteMany"];

export function createAuditExtension(logger: Logger) {
    return Prisma.defineExtension((client) => {
        return client.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
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

                        // CREATE
                        if (operation === "create") {
                            const result = (await query(args)) as Record<
                                string,
                                unknown
                            >;

                            // Use the RAW client (via `client`) to write the audit log
                            // NOT the extended client — that would cause infinite recursion
                            // because the extended client would intercept this write too
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

                        // UPDATE
                        if (operation === "update") {
                            const typedArgs = args as {
                                where: Record<string, unknown>;
                            };

                            // Fetch old snapshot BEFORE the mutation
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
                                        action: "UPDATE",
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

                        // DELETE
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

                        // updateMany / deleteMany
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
