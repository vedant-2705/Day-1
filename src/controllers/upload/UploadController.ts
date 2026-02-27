/**
 * @module UploadController
 * @description HTTP layer for file upload endpoints.
 * Validates that a file was actually attached, then delegates to use cases.
 * All routes require authMiddleware - userId is read from req.user, never from body.
 */

import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "helpers/ResponseHelper.js";
import { AuthenticatedRequest } from "middlewares/AuthMiddleware.js";
import { BadRequestError } from "shared/errors/BadRequestError.js";
import { ErrorKeys } from "constants/ErrorCodes.js";
import {
    UPLOAD_PROFILE_PICTURE_USE_CASE,
    UploadProfilePictureUseCase,
} from "use-cases/upload/UploadProfilePictureUseCase.js";
import {
    UPLOAD_DOCUMENT_USE_CASE,
    UploadDocumentUseCase,
} from "use-cases/upload/UploadDocumentUseCase.js";
import { GET_USER_DOCUMENTS_USE_CASE, GetUserDocumentsUseCase } from "use-cases/upload/GetUserDocumentUseCase.js";

@singleton()
export class UploadController {
    constructor(
        @inject(UPLOAD_PROFILE_PICTURE_USE_CASE)
        private readonly uploadProfilePictureUseCase: UploadProfilePictureUseCase,

        @inject(UPLOAD_DOCUMENT_USE_CASE)
        private readonly uploadDocumentUseCase: UploadDocumentUseCase,

        @inject(GET_USER_DOCUMENTS_USE_CASE)
        private readonly getUserDocumentUseCase: GetUserDocumentsUseCase,
    ) {}

    /**
     * POST /upload/profile
     * Uploads and replaces the authenticated user's profile picture.
     * Expects multipart/form-data with a `file` field containing an image.
     * @responds 200 - Returns { profilePicture: url, width, height }
     * @responds 400 - No file attached or invalid file type/size
     */
    uploadProfile = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const authReq = req as AuthenticatedRequest;

        // Multer populates req.file - if absent, no file was attached
        if (!req.file) {
            throw new BadRequestError(ErrorKeys.BAD_REQUEST, {});
        }

        const result = await this.uploadProfilePictureUseCase.execute(
            authReq.user.userId,
            req.file.buffer,
            req.file.originalname,
        );

        res.status(StatusCodes.OK).json(successResponse(result));
    };

    /**
     * POST /upload/document
     * Uploads a document (PDF / DOCX / DOC) and creates a Document record.
     * Expects multipart/form-data with a `file` field.
     * @responds 201 - Returns the created DocumentDTO
     * @responds 400 - No file attached or invalid file type/size
     */
    uploadDocument = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const authReq = req as AuthenticatedRequest;

        if (!req.file) {
            throw new BadRequestError(ErrorKeys.BAD_REQUEST, {});
        }

        const document = await this.uploadDocumentUseCase.execute(
            authReq.user.userId,
            req.file.buffer,
            req.file.originalname,
        );

        res.status(StatusCodes.CREATED).json(successResponse(document));
    };

    /**
     * GET /upload/documents
     * Returns all documents uploaded by the authenticated user, newest first.
     * @responds 200 - Array of DocumentDTOs
     */
    getDocuments = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const authReq = req as AuthenticatedRequest;

        const documents = await this.getUserDocumentUseCase.execute(
            authReq.user.userId,
        );

        res.status(StatusCodes.OK).json(successResponse(documents));
    };
}
