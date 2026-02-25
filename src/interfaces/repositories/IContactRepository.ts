/**
 * @module IContactRepository
 * @description Contract for the Contact data-access layer.
 * Abstracts the persistence mechanism so use cases depend only on this interface,
 * not on Prisma directly - enabling easier testing and swappable implementations.
 */

import { ContactDTO } from "dto/ContactDTO.js";
import { AuditLog } from "generated/prisma/client.js";
import { ContactQueryParams, CursorPaginatedResult, OffsetPaginatedResult } from "lib/pagination/types.js";
import {
    CreateContactDTO,
    UpdateContactDTO,
} from "validators/contactValidator.js";

export interface IContactRepository {

    /** Retrieves all contacts. Returns an empty array if none exist. */
    findAll(): Promise<ContactDTO[]>;

    /**
     * Retrieves a contact by its unique identifier.
     * @param id UUID of the contact
     * @returns The matching ContactDTO, or `null` if not found
     */
    findById(id: string): Promise<ContactDTO | null>;

    /**
     * Retrieves a contact by email address.
     * @param email Email address to look up
     * @returns The matching ContactDTO, or `null` if not found
     */
    findByEmail(email: string): Promise<ContactDTO | null>;

    /**
     * Persists a new contact.
     * @param input Validated contact creation payload
     * @returns The newly created ContactDTO
     */
    create(input: CreateContactDTO): Promise<ContactDTO>;

    /**
     * Updates an existing contact.
     * @param id    UUID of the contact to update
     * @param input Partial update payload - at least one field required
     * @returns The updated ContactDTO, or `null` if the contact does not exist
     */
    update(id: string, input: UpdateContactDTO): Promise<ContactDTO | null>;

    /**
     * Deletes a contact by ID.
     * @param id UUID of the contact to delete
     * @returns `true` if deleted, `false` if the contact did not exist
     */
    delete(id: string): Promise<boolean>;

    /** v2: Retrieves contacts with offset-based pagination, optional search, filter, and sort.
     * @param params Query parameters including page, limit, search, and sort options
     * @returns A page of ContactDTOs with offset pagination metadata
     */
    findAllWithOffset(params: ContactQueryParams): Promise<OffsetPaginatedResult<ContactDTO>>;

    /** v2: Retrieves contacts with cursor-based pagination, optional search, filter, and sort.
     * @param params Query parameters including cursor, limit, direction, search, and sort options
     * @returns A page of ContactDTOs with cursor pagination metadata
     */
    findAllWithCursor(params: ContactQueryParams): Promise<CursorPaginatedResult<ContactDTO>>;

    /**
     * Returns all audit log entries for a specific contact, ordered newest first.
     * Used by the `GET /contacts/:id/history` endpoint.
     * @param contactId UUID of the contact whose history is being requested
     * @returns Array of raw {@link AuditLog} records in descending chronological order
     */
    getAuditHistory(contactId: string): Promise<AuditLog[]>;

    /**
     * Returns raw aggregate statistics for the reports endpoint.
     * Raw database types are returned here intentionally - the use case layer
     * is responsible for shaping the data into the final report DTO.
     * @returns Total contact count, contacts added today, and per-domain email counts
     */
    getContactStats(): Promise<{
        total: number;
        addedToday: number;
        domainCounts: { domain: string; count: number }[];
    }>;
   
}

/** DI injection token for {@link IContactRepository}. */
export const CONTACT_REPOSITORY = Symbol.for("IContactRepository");
