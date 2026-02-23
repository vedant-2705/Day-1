import "reflect-metadata";
import { PrismaClient, Prisma } from "generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { inject, singleton } from "tsyringe";
import { config } from "@config/env.js";
import { LOGGER, Logger } from "@infrastructure/logging/Logger.js";

@singleton()
export class DatabaseConnection {
    private static instance: PrismaClient;
    private prisma: PrismaClient;

    constructor(
        @inject(LOGGER) 
        private readonly logger: Logger
    ) {
        this.prisma = DatabaseConnection.getInstance(logger);
    }

    private static getInstance(logger: Logger): PrismaClient {
        if (!DatabaseConnection.instance) {
            logger.info("Initializing Prisma Client");

            const adapter = new PrismaPg({
                connectionString: config.dbUrl,
            })

            DatabaseConnection.instance = new PrismaClient({
                adapter,
                log: [
                    { level: "query", emit: "event" },
                    { level: "error", emit: "event" },
                    { level: "warn", emit: "event" },
                ],
            });

            DatabaseConnection.instance.$on("query" as never, (e: Prisma.QueryEvent) => {
                logger.debug("Database Query", {
                    query: e.query,
                    params: e.params,
                    duration: `${e.duration}ms`,
                });
            });

            DatabaseConnection.instance.$on("error" as never, (e: Prisma.LogEvent) => {
                logger.error("Database Error", e);
            });

            DatabaseConnection.instance.$on("warn" as never, (e: Prisma.LogEvent) => {
                logger.warn("Database Warning", e);
            });
        }

        return DatabaseConnection.instance;
    }

    getClient(): PrismaClient {
        return this.prisma;
    }

    async connect(): Promise<void> {
        try {
            await this.prisma.$connect();
            this.logger.info("Database connected successfully");
        } catch (error) {
            this.logger.error("Failed to connect to database", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.prisma.$disconnect();
            this.logger.info("Database disconnected");
        } catch (error) {
            this.logger.error("Error disconnecting from database", error);
            throw error;
        }
    }

    /**
     * Execute operations within a database transaction.
     * Auto-commits on success, auto-rolls back on error.
     */
    async transaction<T>(
        callback: (tx: Prisma.TransactionClient) => Promise<T>,
        options?: {
            maxWait?: number;
            timeout?: number;
            isolationLevel?: Prisma.TransactionIsolationLevel;
        }
    ): Promise<T> {
        this.logger.debug("Starting database transaction");

        try {
            const result = await this.prisma.$transaction(callback, {
                maxWait: options?.maxWait ?? 2000,
                timeout: options?.timeout ?? 5000,
                isolationLevel:
                    options?.isolationLevel ??
                    Prisma.TransactionIsolationLevel.ReadCommitted,
            });

            this.logger.debug("Transaction committed successfully");
            return result;
        } catch (error) {
            this.logger.error("Transaction rolled back", error);
            throw error;
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            this.logger.error("Database health check failed", error);
            return false;
        }
    }
}

export const DATABASE_CONNECTION = Symbol.for("DATABASE_CONNECTION");