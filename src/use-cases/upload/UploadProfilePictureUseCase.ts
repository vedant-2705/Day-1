/**
 * @module UploadProfilePictureUseCase
 * @description Handles profile picture upload: validates file bytes, deletes
 * the old picture from storage (if any), uploads the new one, and updates the
 * User record with the new URL.
 *
 * Security steps:
 *  1. Magic-byte validation (authoritative MIME check)
 *  2. Old picture deletion BEFORE new upload to avoid orphaned assets
 *  3. User record updated atomically after successful upload
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import {
    STORAGE_SERVICE,
    type IStorageService,
} from "interfaces/services/IStorageService.js";
import {
    USER_REPOSITORY,
    type IUserRepository,
} from "interfaces/repositories/IUserRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { validateFileBytes } from "validators/fileValidator.js";
import { buildFolder, generateFileName } from "utils/fileNameGenerator.js";
import { BadRequestError } from "shared/errors/BadRequestError.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { ErrorKeys } from "constants/ErrorCodes.js";
import { ProfilePictureDTO } from "dto/UploadDTO.js";

@injectable()
export class UploadProfilePictureUseCase {
    constructor(
        @inject(STORAGE_SERVICE)
        private readonly storageService: IStorageService,

        @inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * Uploads a profile picture for the authenticated user.
     *
     * @param userId - Authenticated user's ID (from JWT - never from request body).
     * @param buffer - Raw file bytes from Multer memoryStorage.
     * @param originalName - Original filename from the multipart upload (display only).
     * @returns {@link ProfilePictureDTO} with the new CDN URL and dimensions.
     * @throws {BadRequestError} If magic-byte validation fails.
     * @throws {NotFoundError}   If the user no longer exists.
     */
    async execute(
        userId: string,
        buffer: Buffer,
        originalName: string,
    ): Promise<ProfilePictureDTO> {
        this.logger.info(`Profile picture upload started for user ${userId}`);

        // Magic-byte validation
        const validation = validateFileBytes(buffer, "image");
        if (!validation.valid) {
            throw new BadRequestError(ErrorKeys.BAD_REQUEST, {});
        }
        const confirmedMimeType = validation.mimeType!;

        // Fetch current user (to get existing picture URL for cleanup)
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError(ErrorKeys.USER_NOT_FOUND, { id: userId });
        }

        // Delete old profile picture from storage
        // We delete BEFORE uploading the new one. If the upload fails, the user
        // temporarily has no picture rather than two orphaned pictures.
        if ((user as any).profilePicturePath) {
            await this.storageService.delete({
                storagePath: (user as any).profilePicturePath,
                resourceType: "image",
            });
            this.logger.info(`Deleted old profile picture for user ${userId}`);
        }

        // Upload new picture
        const folder = buildFolder(userId, "profile");
        const fileName = generateFileName();

        const uploadResult = await this.storageService.upload(
            buffer,
            confirmedMimeType,
            { folder, fileName, resourceType: "image" },
        );

        // Update user record
        await this.userRepository.updateProfilePicture(
            userId,
            uploadResult.publicUrl,
            uploadResult.storagePath,
        );

        this.logger.info(
            `Profile picture updated for user ${userId}: ${uploadResult.publicUrl}`,
        );

        return {
            profilePicture: uploadResult.publicUrl,
            width: uploadResult.width,
            height: uploadResult.height,
        };
    }
}

export const UPLOAD_PROFILE_PICTURE_USE_CASE = Symbol.for(
    "UploadProfilePictureUseCase",
);
