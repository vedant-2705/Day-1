/**
 * @module UploadMiddleware
 * @description Wraps Multer's single-file upload so that Multer errors are
 * converted to typed AppErrors before reaching the global error handler.
 *
 * Why this wrapper exists:
 *   Multer throws its own MulterError class and calls next(err) with it.
 *   The global ErrorHandler only knows about ZodError, AppError, and Prisma errors.
 *   Without this wrapper, a file-too-large error would fall through to the
 *   generic 500 handler and return a confusing response.
 *
 * This middleware intercepts Multer errors and maps them to the correct
 * AppError subclass so the RFC 7807 response shape is always returned.
 */

import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { profileUpload, documentUpload } from "config/multerConfig.js";
import { BadRequestError } from "shared/errors/BadRequestError.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

/**
 * Creates an Express middleware that runs a Multer single-file upload
 * and maps any Multer errors to BadRequestErrors.
 *
 * @param uploadInstance - A configured Multer instance (profileUpload or documentUpload).
 * @param fieldName      - The multipart form field name containing the file. Defaults to "file".
 */
function wrapMulter(
    uploadInstance: ReturnType<typeof multer>,
    fieldName = "file",
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        uploadInstance.single(fieldName)(req, res, (err: unknown) => {
            if (!err) return next();

            // Multer-specific errors (file too large, too many files, etc.)
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return next(new BadRequestError(ErrorKeys.BAD_REQUEST, {}));
                }
                if (err.code === "LIMIT_FILE_COUNT") {
                    return next(new BadRequestError(ErrorKeys.BAD_REQUEST, {}));
                }
                return next(new BadRequestError(ErrorKeys.BAD_REQUEST, {}));
            }

            // MIME_TYPE_ERROR thrown by our fileFilter (not a MulterError)
            if (err instanceof Error && err.name === "MIME_TYPE_ERROR") {
                return next(new BadRequestError(ErrorKeys.BAD_REQUEST, {}));
            }

            // Unknown error - pass through to global handler
            next(err);
        });
    };
}

/**
 * Middleware for profile picture uploads.
 * Accepts a single file in the `file` form field.
 * Enforces image MIME types and MAX_PROFILE_SIZE_MB limit.
 */
export const handleProfileUpload = wrapMulter(profileUpload, "file");

/**
 * Middleware for document uploads.
 * Accepts a single file in the `file` form field.
 * Enforces document MIME types and MAX_DOCUMENT_SIZE_MB limit.
 */
export const handleDocumentUpload = wrapMulter(documentUpload, "file");
