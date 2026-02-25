/**
 * @module ZodErrorHelper
 * @description Handler for Zod schema validation errors.
 * Converts a {@link ZodError} into a structured 422 Unprocessable Entity response
 * with human-readable field-level validation details.
 */

import type { Request, Response } from "express";
import { errorResponse } from "helpers/ResponseHelper.js";
import { StatusCodes } from "http-status-codes";
import z, { ZodError } from "zod";

/**
 * Formats and sends an HTTP response for a Zod schema validation error.
 *
 * @param err - The ZodError containing one or more validation issue descriptors.
 * @param req - The Express request object, used to populate the `instance` field in the error envelope.
 * @param res - The Express response object used to send the JSON error response.
 * @returns The Express response with a 422 status code and a structured validation error envelope.
 *
 * @remarks
 * A 422 Unprocessable Entity is used rather than 400 Bad Request because the request
 * was syntactically valid JSON but failed semantic validation (e.g. wrong field values,
 * missing required fields). The `details` field contains the output of `z.prettifyError`
 * so clients receive actionable, field-level feedback.
 */
export const handleZodError = (err: ZodError, req: Request, res: Response) => {
    const details = z.prettifyError(err);

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
