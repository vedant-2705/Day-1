import type { Response } from "express";
import { errorResponse } from "helpers/ResponseHelper.js";
import { StatusCodes } from "http-status-codes";
import z, { ZodError } from "zod";


export const handleZodError = (err: ZodError, res: Response) => {
    const details = z.prettifyError(err);

    return res.status(StatusCodes.BAD_REQUEST).json(
        errorResponse(
            "VALIDATION_ERROR", 
            "Invalid request data", 
            details
        )
    );
};