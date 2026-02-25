/**
 * @module DatabaseConnection
 * @description Manages the PrismaClient instance and database connectivity.
 * Implements a singleton pattern to ensure only one PrismaClient is used across the app,
 * preventing multiple connection pools and ensuring efficient resource usage.
 * Provides helper methods for transactions and health checks.
 */

import "reflect-metadata";
import { PrismaClient, Prisma } from "generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { inject, singleton } from "tsyringe";
import { config } from "config/env.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { createSoftDeleteExtension } from "./extensions/SoftDeleteExtension.js";
import { createAuditExtension } from "./extensions/PrismaExtension.js";

function buildExtendedClient(logger: Logger) {
    const adapter = new PrismaPg({ connectionString: config.dbUrl });

    const base = new PrismaClient({
        adapter,
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'event' },
            { level: 'warn',  emit: 'event' },
        ],
    });

    // Forward Prisma log events to app logger
    base.$on('query' as never, (e: Prisma.QueryEvent) => {
        logger.debug('Database Query', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
        });
    });

    base.$on('error' as never, (e: Prisma.LogEvent) => {
        logger.error('Database Error', e);
    });

    base.$on('warn' as never, (e: Prisma.LogEvent) => {
        logger.warn('Database Warning', e);
    });
    
    return base
        .$extends(createSoftDeleteExtension(logger))
        .$extends(createAuditExtension(logger));
}

// This is the correct way to type an extended Prisma client in TypeScript
// typeof lets us derive the type from the actual implementation
export type ExtendedPrismaClient = ReturnType<typeof buildExtendedClient>;

// Derive the transaction client type directly from ExtendedPrismaClient's $transaction overload.
// Parameters<$transaction>[0] is the callback fn; Parameters of that fn gives us the client.
export type ExtendedTransactionClient = Parameters<Parameters<ExtendedPrismaClient['$transaction']>[0]>[0];


/**
 * Singleton class that manages the PrismaClient instance and database lifecycle.
 *
 * @remarks
 * PrismaClient is initialized lazily on first resolution to avoid connecting
 * before the app is ready. Only one instance is created to prevent multiple
 * connection pools. Prisma query/warn/error events are forwarded to the app Logger.
 */
@singleton()
export class DatabaseConnection {
    private static instance: ExtendedPrismaClient | null = null;
    private prisma: ExtendedPrismaClient;

    constructor(
        @inject(LOGGER)
        private readonly logger: Logger
    ) {
        this.prisma = DatabaseConnection.getInstance(logger);
    }

    /**
     * Returns the singleton instance of PrismaClient.
     * 
     * @param logger Logger instance for logging initialization events
     * @returns The singleton PrismaClient instance
     */
    private static getInstance(logger: Logger): ExtendedPrismaClient {
        if (!DatabaseConnection.instance) {
            logger.info("Initializing Prisma Client");

            DatabaseConnection.instance = buildExtendedClient(logger);
        }
        return DatabaseConnection.instance;
    }

    /** Returns the PrismaClient instance for executing database operations. */
    getClient(): ExtendedPrismaClient {
        return this.prisma;
    }

    /**
     * Explicitly opens the database connection.
     * PrismaClient connects lazily by default - this ensures the connection is
     * established and verified before the server starts accepting traffic.
     */
    async connect(): Promise<void> {
        try {
            await this.prisma.$connect();
            this.logger.info("Database connected successfully");
        } catch (error) {
            this.logger.error("Failed to connect to database", error);
            throw error;
        }
    }

    /**
     * Gracefully closes the database connection.
     * Should be called on SIGTERM/SIGINT to flush in-flight queries before shutdown.
     */
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
        callback: (tx: ExtendedTransactionClient) => Promise<T>,
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

    /**
     * Verifies the database connection by running a lightweight query.
     * Used by the `/health` endpoint.
     * @returns `true` if the database is reachable, `false` otherwise
     */
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

/** DI injection token for {@link DatabaseConnection}. */
export const DATABASE_CONNECTION = Symbol.for("DATABASE_CONNECTION");