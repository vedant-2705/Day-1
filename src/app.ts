import "reflect-metadata";
import express, { Request, Response } from "express";
import { config } from "config/env.js";
import { requestLogger } from "middlewares/RequestLogger.js";
import { errorHandler } from "middlewares/ErrorHandler.js";
import { container } from "tsyringe";
import { DatabaseConnection } from "database/DatabaseConnection.js";
import { Logger } from "logging/Logger.js";
import { registerDependencies } from "config/container.js";

registerDependencies();

import contactRoutes from "routes/contactRoutes.js";

const app = express();
const logger = container.resolve(Logger);
const dbConnection = container.resolve(DatabaseConnection);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
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

app.use("/api/contacts", contactRoutes);

// 404 catch-all
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Route not found" },
    });
});

app.use(errorHandler);

// Start server
async function startServer() {
    try {
        // Connect to database
        await dbConnection.connect();
        logger.info("Database connection established");

        // Start listening
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

// Signal Terminate (System, Docker, K8s)
process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully");
    await dbConnection.disconnect();
    process.exit(0);
});

// Signal Interrupt (Ctrl+C)
process.on("SIGINT", async () => {
    logger.info("SIGINT received, shutting down gracefully");
    await dbConnection.disconnect();
    process.exit(0);
});

startServer();

export default app;
