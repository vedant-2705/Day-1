import path from "path";
import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";
const envFile = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envFile });

interface AppConfig {
    env: string;
    port: number;
    appName: string;
    dbUrl: string;
    logLevel: string;
}

function loadConfig(): AppConfig {
    const required = ["PORT", "APP_NAME", "DATABASE_URL", "LOG_LEVEL"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(
            `Missing required env variables: ${missing.join(", ")}`,
        );
    }

    return {
        env,
        port: parseInt(process.env.PORT!, 10),
        appName: process.env.APP_NAME!,
        dbUrl: process.env.DATABASE_URL!,
        logLevel: process.env.LOG_LEVEL!,
    };
}

export const config = loadConfig();
