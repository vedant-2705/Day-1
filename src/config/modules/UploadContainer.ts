/**
 * @module UploadContainer
 * @description Registers all upload-domain dependencies into the tsyringe IoC container.
 *
 * Storage provider selection:
 *   STORAGE_PROVIDER=cloudinary (default) -> CloudinaryStorageService
 *   STORAGE_PROVIDER=local                -> LocalStorageService
 *
 * This env-driven swap is the only place the concrete storage class is referenced.
 * All other code depends on IStorageService - zero changes needed to switch providers.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { STORAGE_SERVICE } from "interfaces/services/IStorageService.js";
import { CloudinaryStorageService } from "services/CloudinaryStorageService.js";
import { LocalStorageService } from "services/LocalStorageService.js";
import { DOCUMENT_REPOSITORY } from "interfaces/repositories/IDocumentRepository.js";
import { DocumentRepository } from "repositories/DocumentRepository.js";
import {
    UPLOAD_PROFILE_PICTURE_USE_CASE,
    UploadProfilePictureUseCase,
} from "use-cases/upload/UploadProfilePictureUseCase.js";
import {
    UPLOAD_DOCUMENT_USE_CASE,
    UploadDocumentUseCase,
} from "use-cases/upload/UploadDocumentUseCase.js";
import { UploadController } from "controllers/upload/UploadController.js";
import { GET_USER_DOCUMENTS_USE_CASE, GetUserDocumentsUseCase } from "use-cases/upload/GetUserDocumentUseCase.js";
import { DOCUMENT_MAPPER } from "interfaces/mapper/IDocumentMapper.js";
import { DocumentMapper } from "mapper/DocumentMapper.js";

export function registerUploadContainer() {
    // Storage provider (env-driven)
    // Singleton: storage service is stateless, safe to share across requests.
    const storageProvider = process.env["STORAGE_PROVIDER"] ?? "cloudinary";

    if (storageProvider === "local") {
        container.registerSingleton(STORAGE_SERVICE, LocalStorageService);
    } else {
        container.registerSingleton(STORAGE_SERVICE, CloudinaryStorageService);
    }

    // Repository (Singleton)
    container.registerSingleton(DOCUMENT_REPOSITORY, DocumentRepository);

    // Use Cases (Singleton)
    // Singleton: upload use cases are stateless - safe to share.
    container.registerSingleton(
        UPLOAD_PROFILE_PICTURE_USE_CASE,
        UploadProfilePictureUseCase,
    );
    container.registerSingleton(
        UPLOAD_DOCUMENT_USE_CASE,
        UploadDocumentUseCase,
    );

    container.registerSingleton(
        GET_USER_DOCUMENTS_USE_CASE,
        GetUserDocumentsUseCase,
    )

    container.registerSingleton(DOCUMENT_MAPPER, DocumentMapper);

    // Controller (Singleton)
    container.registerSingleton<UploadController>(UploadController);
}
