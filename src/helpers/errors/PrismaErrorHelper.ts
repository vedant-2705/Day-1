/**
 * @module PrismaErrorHelper
 * @description Handler for Prisma database errors of type {@link Prisma.PrismaClientKnownRequestError}.
 * Maps well-known Prisma error codes (P2002, P2025, P2003) to semantically correct
 * HTTP responses, and provides a safe fallback for any unrecognised database error.
 */

import { Prisma } from "generated/prisma/client.js";
import type { Request, Response } from "express";
import { errorResponse } from "helpers/ResponseHelper.js";
import { StatusCodes } from "http-status-codes";
import { DbErrorCodes } from "constants/DbErrorCodes.js";

/**
 * Formats and sends an HTTP response for a known Prisma request error.
 *
 * @param err - The Prisma known-request error containing a Prisma error code and optional metadata.
 * @param req - The Express request object, used to populate the `instance` field in the error envelope.
 * @param res - The Express response object used to send the JSON error response.
 * @returns The Express response with the appropriate HTTP status code and error envelope.
 *
 * @remarks
 * Handled Prisma error codes:
 * - **P2002** (`UNIQUE_CONSTRAINT_VIOLATION`) - 409 Conflict; extracts the conflicting field from `err.meta.target`.
 * - **P2025** (`RECORD_NOT_FOUND`) - 404 Not Found.
 * - **P2003** (`FOREIGN_KEY_VIOLATION`) - 400 Bad Request; indicates an invalid reference to a related record.
 *
 * Any unrecognised Prisma error falls through to a 500 Internal Server Error response.
 * The raw error is logged to the console to aid investigation without leaking internals to the client.
 */
export const handlePrismaError = (
    err: Prisma.PrismaClientKnownRequestError,
    req: Request,
    res: Response,
) => {
    // P2002: Unique constraint violation - extract the offending field from metadata
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

    // P2025: Record not found - the target row does not exist in the database
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

    // P2003: Foreign key violation - a referenced related record does not exist
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

    // Fallback: unrecognised Prisma error - log internally and return a generic 500
    console.error("Unknown Prisma Error:", err);
    return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
            errorResponse("DB_ERROR", "Database operation failed.", undefined, req.path),
        );
};
