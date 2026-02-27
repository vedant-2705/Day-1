/**
 * @module UploadDocumentUseCase
 * @description Handles document uploads (PDF / DOCX / DOC): validates file bytes,
 * uploads to storage, and persists a Document record in the database.
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import {
    STORAGE_SERVICE,
    type IStorageService,
} from "interfaces/services/IStorageService.js";
import {
    DOCUMENT_REPOSITORY,
    type IDocumentRepository,
} from "interfaces/repositories/IDocumentRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { validateFileBytes } from "validators/fileValidator.js";
import { buildFolder, generateFileName } from "utils/fileNameGenerator.js";
import { BadRequestError } from "shared/errors/BadRequestError.js";
import { ErrorKeys } from "constants/ErrorCodes.js";
import { DocumentDTO } from "dto/UploadDTO.js";

@injectable()
export class UploadDocumentUseCase {
    constructor(
        @inject(STORAGE_SERVICE)
        private readonly storageService: IStorageService,

        @inject(DOCUMENT_REPOSITORY)
        private readonly documentRepository: IDocumentRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * Uploads a document for the authenticated user.
     *
     * @param userId       - Authenticated user's ID (from JWT).
     * @param buffer       - Raw file bytes from Multer memoryStorage.
     * @param originalName - Original filename - stored for display, never used as key.
     * @returns {@link DocumentDTO} representing the persisted document record.
     * @throws {BadRequestError} If magic-byte validation fails.
     */
    async execute(
        userId: string,
        buffer: Buffer,
        originalName: string,
    ): Promise<DocumentDTO> {
        this.logger.info(
            `Document upload started for user ${userId}: ${originalName}`,
        );

        // Magic-byte validation
        const validation = validateFileBytes(buffer, "document");
        if (!validation.valid) {
            throw new BadRequestError(ErrorKeys.BAD_REQUEST, {});
        }
        const confirmedMimeType = validation.mimeType!;

        // Upload to storage
        const folder = buildFolder(userId, "documents");
        const fileName = generateFileName();

        const uploadResult = await this.storageService.upload(
            buffer,
            confirmedMimeType,
            { folder, fileName, resourceType: "document" },
        );

        // Persist document record
        const document = await this.documentRepository.create({
            userId,
            fileName: originalName, // store original name for display
            storagePath: uploadResult.storagePath,
            publicUrl: uploadResult.publicUrl,
            mimeType: confirmedMimeType,
            sizeBytes: uploadResult.sizeBytes,
        });

        this.logger.info(
            `Document uploaded for user ${userId}: ${document.id} -> ${uploadResult.publicUrl}`,
        );

        return document;
    }
}

export const UPLOAD_DOCUMENT_USE_CASE = Symbol.for("UploadDocumentUseCase");
