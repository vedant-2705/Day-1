import { AppError } from "shared/errors/AppError.js";
import type { Response } from "express";
import { errorResponse } from "helpers/ResponseHelper.js";
import { ValidationError } from "shared/errors/ValidationError.js";

export const handleAppError = (err: AppError, res: Response) => {
    return res.status(err.statusCode).json(
        errorResponse(
            err.errorCode || "APP_ERROR",
            err.message,
            err instanceof ValidationError ? err.details : undefined
        )
    );
};