/**
 * @module ContactRepository
 * @description Prisma-backed implementation of {@link IContactRepository}.
 * Uses raw SQL (`$queryRaw`) for operations that require features not yet
 * supported by the Prisma query builder with the pg adapter (e.g. COALESCE updates).
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { DATABASE_CONNECTION, DatabaseConnection } from "database/DatabaseConnection.js";
import { IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { CreateContactDTO, UpdateContactDTO } from "validators/contactValidator.js";
import { ContactDTO } from "dto/ContactDTO.js";
import { CONTACT_MAPPER, type IContactMapper } from "interfaces/mapper/IContactMapper.js";

@injectable()
export class ContactRepository implements IContactRepository {
    constructor(
        @inject(DATABASE_CONNECTION)
        private readonly dbConnection: DatabaseConnection,

        @inject(CONTACT_MAPPER)
        private readonly contactMapper: IContactMapper
    ) {}

    /** Convenience accessor to avoid repeating `this.dbConnection.getClient()` throughout. */
    private get prisma() {
        return this.dbConnection.getClient();
    }

    /**
     * Fetches all contacts from the database
     * 
     * @returns An array representing all contacts in the database
     */
    async findAll(): Promise<ContactDTO[]> {
        const contacts = await this.prisma.contact.findMany();
        // const contacts: Contact[] = await this.prisma.$queryRaw`SELECT * FROM "contacts"`;
        
        return this.contactMapper.toDTOs(contacts);
    }

    /**
     * Finds a contact by its email address in the database
     * 
     * @param email email address of the contact to find
     * 
     * @returns The contact DTO if found, otherwise null
     */
    async findByEmail(email: string): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.findUnique({
            where: {
                email,
            },
        });

        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    /**
     * Finds a contact by its unique identifier in the database
     * 
     * @param id unique identifier of the contact to find
     * 
     * @returns The contact DTO if found, otherwise null
     */
    async findById(id: string): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.findUnique({
            where: {
                id,
            },
        });
        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    /**
     * Creates a new contact in the database using the provided input data.
     * 
     * @param input data required to create a new contact, including name, email, phone, and address.
     * @returns The ContactDTO representing the newly created contact.
     */
    async create(input: CreateContactDTO): Promise<ContactDTO> {
        const contact = await this.prisma.contact.create({
            data: input,
        });

        return this.contactMapper.toDTO(contact);
    }

    /**
     * Updates an existing contact in the database with the provided input data.
     * 
     * @param id unique identifier of the contact to update.
     * @param input data to update the contact with.
     * 
     * @returns The updated ContactDTO if successful, otherwise null.
     */
    async update(id: string, input: UpdateContactDTO): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.update({
            where: { id },
            data: { ...input, version: { increment: 1 } },
        });

        // const { name, email, phone, address } = input;

        // const contacts: Contact[] = await this.prisma.$queryRaw`UPDATE "contacts" SET
        //     name = COALESCE(${name}, name),
        //     email = COALESCE(${email}, email),
        //     phone = COALESCE(${phone}, phone),
        //     address = COALESCE(${address}, address),
        //     "updatedAt" = CURRENT_TIMESTAMP,
        //     "version" = version + 1
        //     WHERE id = ${id} RETURNING *`;

        // const contact = contacts[0];

        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    /**
     * Deletes a contact from the database by its unique identifier.
     * 
     * @param id unique identifier of the contact to delete.
     * 
     * @returns A boolean indicating whether the deletion was successful.
     */
    async delete(id: string): Promise<boolean> {
 
        // const contact = await this.prisma.contact.delete({
        //     where: {
        //         id,
        //     },
        // });

        const contact = await this.prisma.contact.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return contact ? true : false;
    }
}