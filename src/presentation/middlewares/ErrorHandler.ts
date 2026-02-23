import { Request, Response, NextFunction } from "express";
import z, { ZodError } from "zod";
import { AppError } from "@shared/errors/AppError.js";
import { errorResponse } from "@presentation/helpers/ResponseHelper.js";
import { ValidationError } from "@shared/errors/ValidationError.js";


export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (err instanceof ZodError) {
        const details = z.treeifyError(err);
        res.status(422).json(
            errorResponse(
                "VALIDATION_ERROR",
                "Request validation failed",
                details,
            ),
        );
        return;
    }

    if (err instanceof AppError) {
        const body = errorResponse(
            err.errorCode as string || "APP_ERROR",
            err.message,
            err instanceof ValidationError ? err.details : undefined,
        );
        res.status(err.statusCode).json(body);
        return;
    }

    console.error("[Unhandled Error]", err);
    res.status(500).json(
        errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred"),
    );
}
