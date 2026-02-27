/**
 * @module GetUserDocumentsUseCase
 * @description Returns all documents uploaded by a specific user, newest first.
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import {
    DOCUMENT_REPOSITORY,
    type IDocumentRepository,
} from "interfaces/repositories/IDocumentRepository.js";
import { DocumentDTO } from "dto/UploadDTO.js";

@injectable()
export class GetUserDocumentsUseCase {
    constructor(
        @inject(DOCUMENT_REPOSITORY)
        private readonly documentRepository: IDocumentRepository,
    ) {}

    /**
     * Retrieves all documents owned by the given user.
     *
     * @param userId - The authenticated user's ID (from JWT - not from the request body).
     * @returns Array of {@link DocumentDTO} ordered by uploadedAt descending.
     *          Returns an empty array if the user has no documents.
     */
    async execute(userId: string): Promise<DocumentDTO[]> {
        return this.documentRepository.findAllByUserId(userId);
    }
}

export const GET_USER_DOCUMENTS_USE_CASE = Symbol.for(
    "GetUserDocumentsUseCase",
);
