/**
 * @module IDocumentRepository
 * @description Persistence contract for the Document resource.
 * Documents are files (PDF / DOCX) uploaded by users.
 * Profile pictures are NOT stored here - they are a field on the User record.
 */

import { DocumentDTO, CreateDocumentDTO } from "dto/UploadDTO.js";

export interface IDocumentRepository {
    /**
     * Persists a new document record after a successful storage upload.
     * @param data - Upload metadata returned by the storage service + userId.
     * @returns The newly created {@link DocumentDTO}.
     */
    create(data: CreateDocumentDTO): Promise<DocumentDTO>;

    /**
     * Returns all documents belonging to a specific user, newest first.
     * @param userId - Owner's user ID.
     * @returns Array of {@link DocumentDTO}; empty array if none exist.
     */
    findAllByUserId(userId: string): Promise<DocumentDTO[]>;

    /**
     * Finds a single document by its ID.
     * @param id - Document CUID.
     * @returns The matching {@link DocumentDTO}, or `null` if not found.
     */
    findById(id: string): Promise<DocumentDTO | null>;

    /**
     * Hard-deletes a document record.
     * The caller is responsible for deleting the asset from storage BEFORE calling this.
     * @param id - Document CUID.
     */
    delete(id: string): Promise<void>;
}

/** DI injection token for {@link IDocumentRepository}. */
export const DOCUMENT_REPOSITORY = Symbol.for("IDocumentRepository");
