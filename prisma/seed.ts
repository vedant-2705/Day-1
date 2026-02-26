import path from "path";
import dotenv from "dotenv";

// Load the same env file the app uses
const env = process.env.NODE_ENV || "development";
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter});

async function main() {
    const existing = await prisma.user.findUnique({
        where: { email: "admin@example.com" },
    });

    if (existing) {
        console.log("Admin already exists, skipping");
        return;
    }

    await prisma.user.create({
        data: {
            name: "Admin",
            email: "admin@example.com",
            passwordHash: (await bcrypt.hash("Admin123!", 12)).toString(),
            role: UserRole.ADMIN,
        },
    });

    console.log("Admin user created");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
