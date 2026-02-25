import { AppError } from "shared/errors/AppError.js";
import type { Request, Response } from "express";
import { errorResponse } from "helpers/ResponseHelper.js";
import { ValidationError } from "shared/errors/ValidationError.js";

export const handleAppError = (err: AppError, req: Request, res: Response) => {
    return res.status(err.statusCode).json(
        errorResponse(
            // err.code is the string code from ERROR_CODES
            // e.g. "CONTACT_NOT_FOUND", "CONTACT_EMAIL_CONFLICT"
            err.code,
            err.message,
            err instanceof ValidationError ? err.details : undefined,
            req.path,
        ),
    );
};
