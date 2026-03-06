/**
 * @module app
 * @description Express application entry point.
 * Bootstraps the app in this order:
 *   1. Registers all DI dependencies
 *   2. Configures middleware (JSON parsing, request logging)
 *   3. Mounts routes
 *   4. Registers the global error handler
 *   5. Connects to the database and starts the HTTP server
 *
 * Graceful shutdown is handled for SIGTERM (Docker/K8s) and SIGINT (Ctrl+C).
 */

import "reflect-metadata";
import express, { Request, Response } from "express";
import { config } from "config/env.js";
import { requestLogger } from "middlewares/RequestLogger.js";
import { errorHandler } from "middlewares/ErrorHandler.js";
import { container } from "tsyringe";
import { DatabaseConnection } from "database/DatabaseConnection.js";
import { Logger } from "logging/Logger.js";
import { registerDependencies } from "config/container.js";
import { swaggerSpec } from "config/swagger.js";
import swaggerUi from "swagger-ui-express";

// Must be called before any container.resolve() or route imports that trigger DI
registerDependencies();

import masterRoutes from "routes/index.js";
import cookieParser from "cookie-parser";
import { swaggerSpecYaml } from "config/swagger-yaml.js";
import { RedisConnection } from "cache/RedisConnection.js";


const app = express();
const logger = container.resolve(Logger);
const dbConnection = container.resolve(DatabaseConnection);
const redis = container.resolve(RedisConnection);

// --- Middleware ---
app.use(cookieParser());
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(
//     "/docs",
//     swaggerUi.serve,
//     swaggerUi.setup(swaggerSpec, {
//         customSiteTitle: "API Docs",
//         customCss: ".swagger-ui .topbar { display: none }",
//         swaggerOptions: {
//             persistAuthorization: true,
//             displayRequestDuration: true,
//             filter: true,
//             tryItOutEnabled: true,
//         },
//     }),
// );


app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecYaml));

app.get("/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// --- Routes ---

/**
 * GET /health
 * Returns the current health status of the application and database connection.
 * Used by load balancers and monitoring tools.
 * @responds 200 - App and DB are healthy
 * @responds 503 - DB connection is down
 */
app.get("/health", async (_req: Request, res: Response) => {
    const dbHealthy = await dbConnection.healthCheck();
    res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? "ok" : "error",
        database: dbHealthy ? "connected" : "disconnected",
        env: config.env,
        app: config.appName,
        timestamp: new Date().toISOString(),
    });
});

app.use("/api", masterRoutes);

// Catch-all for unmatched routes - must be registered after all valid routes
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Route not found" },
    });
});

// Global error handler - must be the last middleware registered
app.use(errorHandler);

/**
 * Connects to the database then starts the HTTP server.
 * Exits the process with code 1 if startup fails - prevents a partially
 * initialised server from accepting traffic.
 */
async function startServer() {
    try {
        await dbConnection.connect();
        logger.info("Database connection established");

        // Verify Redis is reachable before accepting traffic
        await redis.ping();
        logger.info("Redis connection established");

        app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port}`, {
                environment: config.env,
                port: config.port,
            });
            logger.info(
                `Health check at http://localhost:${config.port}/health`,
            );
        });
    } catch (error) {
        logger.error("Failed to start server", error);
        process.exit(1);
    }
}

async function shutdown() {
    logger.info("Shutting down gracefully...");
    await redis.disconnect();
    await dbConnection.disconnect();
    process.exit(0);
}

// Graceful shutdown: SIGTERM is sent by Docker, Kubernetes, and process managers (e.g. PM2)
process.on("SIGTERM", shutdown);

// Graceful shutdown: SIGINT is sent when the developer presses Ctrl+C
process.on("SIGINT", shutdown);

startServer();

export default app;
