/**
 * @module IDocumentMapper
 * @description Contract for mapping `Document` domain entities to `DocumentDTO` shapes.
 * Abstracts the mapping logic so consumers depend on the interface, not the implementation.
 */

import { Document } from "domain/entities/Document.js";
import { DocumentDTO } from "dto/UploadDTO.js";

export interface IDocumentMapper {
    /**
     * Converts a single Document entity to a DocumentDTO.
     * @param document Document entity to convert
     * @returns Corresponding DocumentDTO
     */
    toDTO(document: Document): DocumentDTO;

    /**
     * Converts an array of Document entities to an array of DocumentDTOs.
     * @param documents Document entities to convert
     * @returns Array of DocumentDTOs
     */
    toDTOs(documents: Document[]): DocumentDTO[];
}

/** DI injection token for {@link IDocumentMapper}. */
export const DOCUMENT_MAPPER = Symbol.for("IDocumentMapper");
