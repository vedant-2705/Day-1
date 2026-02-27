/**
 * @module DocumentMapper
 * @description Maps Prisma `Document` model objects to `DocumentDTO` shapes.
 * Centralizes the entity-to-DTO transformation so changes to the data model
 * only need to be updated in one place.
 */

import "reflect-metadata";
import { IDocumentMapper } from "interfaces/mapper/IDocumentMapper.js";
import { injectable } from "tsyringe";
import { Document } from "domain/entities/Document.js";
import { DocumentDTO } from "dto/UploadDTO.js";

@injectable()
export class DocumentMapper implements IDocumentMapper {
    /**
     * Converts a single Document entity to a DocumentDTO.
     * @param document Document entity to convert
     * @returns Corresponding DocumentDTO
     */
    toDTO(document: Document): DocumentDTO {
        return {
            id: document.id,
            userId: document.userId,
            fileName: document.fileName,
            publicUrl: document.publicUrl,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
            uploadedAt: document.uploadedAt,
        };
            
    }

    /**
     * Converts an array of Document entities to an array of DocumentDTOs.
     * @param documents Document entities to convert
     * @returns Array of DocumentDTOs
     */
    toDTOs(documents: Document[]): DocumentDTO[] {
        return documents.map(this.toDTO);
    }
}
