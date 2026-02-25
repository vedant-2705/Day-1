import type { Request, Response } from "express";
import { errorResponse } from "helpers/ResponseHelper.js";
import { StatusCodes } from "http-status-codes";
import z, { ZodError } from "zod";

export const handleZodError = (err: ZodError, req: Request, res: Response) => {
    const details = z.prettifyError(err);

    // 422 Unprocessable Entity is semantically correct for validation failures
    // 400 Bad Request = malformed syntax (e.g. invalid JSON)
    // 422 = syntactically correct but semantically invalid (wrong field values)
    return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json(
            errorResponse(
                "VALIDATION_ERROR",
                "The request contains invalid data",
                details,
                req.path,
            ),
        );
};
