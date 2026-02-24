import { Prisma } from "generated/prisma/client.js";
import { Logger } from "logging/Logger.js";

// Models that have a deletedAt column
const SOFT_DELETE_MODELS = ["Contact"] as const;
const READ_OPS = ["findMany", "findFirst", "findUnique", "count", "aggregate"];

export function createSoftDeleteExtension(logger: Logger) {
    return Prisma.defineExtension((client) => {
        return client.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        if (
                            READ_OPS.includes(operation) &&
                            SOFT_DELETE_MODELS.includes(model as any)
                        ) {
                            const readArgs = args as {
                                where?: Record<string, unknown>;
                            };
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
