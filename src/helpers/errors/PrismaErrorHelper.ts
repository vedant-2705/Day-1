import { Prisma } from "generated/prisma/client.js";
import type { Request, Response } from "express";
import { errorResponse } from "helpers/ResponseHelper.js";
import { StatusCodes } from "http-status-codes";
import { DbErrorCodes } from "constants/DbErrorCodes.js";

export const handlePrismaError = (
    err: Prisma.PrismaClientKnownRequestError,
    req: Request,
    res: Response,
) => {
    // P2002: Unique Constraint
    if (err.code === DbErrorCodes.UNIQUE_CONSTRAINT_VIOLATION) {
        const target = (err.meta?.target as string[]) || [];
        const field = target.length > 0 ? target[target.length - 1] : "field";

        return res
            .status(StatusCodes.CONFLICT)
            .json(
                errorResponse(
                    "CONFLICT",
                    `A record with this ${field} already exists`,
                    undefined,
                    req.path,
                ),
            );
    }

    // P2025: Record Not Found
    if (err.code === DbErrorCodes.RECORD_NOT_FOUND) {
        return res
            .status(StatusCodes.NOT_FOUND)
            .json(
                errorResponse(
                    'NOT_FOUND',
                    'The requested record was not found',
                    undefined,
                    req.path,
                ),
            );
    }

    // P2003: Foreign Key Violation
    if (err.code === DbErrorCodes.FOREIGN_KEY_VIOLATION) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json(
                errorResponse(
                    "FOREIGN_KEY_ERROR",
                    "Invalid reference to a related record.",
                    undefined,
                    req.path,
                ),
            );
    }

    // Fallback for unhandled Prisma errors
    console.error("Unknown Prisma Error:", err);
    return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
            errorResponse("DB_ERROR", "Database operation failed.", undefined, req.path),
        );
};
