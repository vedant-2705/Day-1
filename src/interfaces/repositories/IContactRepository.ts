/**
 * @module IContactRepository
 * @description Contract for the Contact data-access layer.
 * Abstracts the persistence mechanism so use cases depend only on this interface,
 * not on Prisma directly - enabling easier testing and swappable implementations.
 */

import { ContactDTO } from "dto/ContactDTO.js";
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
}

/** DI injection token for {@link IContactRepository}. */
export const CONTACT_REPOSITORY = Symbol.for("IContactRepository");
