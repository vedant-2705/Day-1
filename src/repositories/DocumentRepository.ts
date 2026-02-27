/**
 * @module DocumentRepository
 * @description Prisma-backed implementation of {@link IDocumentRepository}.
 */

import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import {
    DATABASE_CONNECTION,
    DatabaseConnection,
} from "database/DatabaseConnection.js";
import { IDocumentRepository } from "interfaces/repositories/IDocumentRepository.js";
import { DocumentDTO, CreateDocumentDTO } from "dto/UploadDTO.js";
import { DOCUMENT_MAPPER, type IDocumentMapper } from "interfaces/mapper/IDocumentMapper.js";

@singleton()
export class DocumentRepository implements IDocumentRepository {
    constructor(
        @inject(DATABASE_CONNECTION)
        private readonly dbConnection: DatabaseConnection,

        @inject(DOCUMENT_MAPPER)
        private readonly documentMapper: IDocumentMapper,
    ) {}

    private get prisma() {
        return this.dbConnection.getClient();
    }

    /** {@inheritDoc IDocumentRepository.create} */
    async create(data: CreateDocumentDTO): Promise<DocumentDTO> {
        const doc = await this.prisma.document.create({ data });
        return this.documentMapper.toDTO(doc);
    }

    /** {@inheritDoc IDocumentRepository.findAllByUserId} */
    async findAllByUserId(userId: string): Promise<DocumentDTO[]> {
        const docs = await this.prisma.document.findMany({
            where: { userId },
            orderBy: { uploadedAt: "desc" },
        });
        return this.documentMapper.toDTOs(docs);
    }

    /** {@inheritDoc IDocumentRepository.findById} */
    async findById(id: string): Promise<DocumentDTO | null> {
        const doc = await this.prisma.document.findUnique({ where: { id } });
        return doc ? this.documentMapper.toDTO(doc) : null;
    }

    /** {@inheritDoc IDocumentRepository.delete} */
    async delete(id: string): Promise<void> {
        await this.prisma.document.delete({ where: { id } });
    }
}
