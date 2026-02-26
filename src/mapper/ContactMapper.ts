/**
 * @module ContactMapper
 * @description Maps Prisma `Contact` model objects to `ContactDTO` shapes.
 * Centralizes the entity-to-DTO transformation so changes to the data model
 * only need to be updated in one place.
 */

import "reflect-metadata";
import { ContactDTO } from "dto/ContactDTO.js";
import { IContactMapper } from "interfaces/mapper/IContactMapper.js";
import { Contact } from "domain/entities/Contact.js";
import { injectable } from "tsyringe";

@injectable()
export class ContactMapper implements IContactMapper {

    /**
     * Converts a single Contact entity to a ContactDTO.
     * @param contact Contact entity to convert
     * @returns Corresponding ContactDTO (excludes internal fields like `version`)
     */
    toDTO(contact: Contact): ContactDTO {
        return {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
            createdBy: contact.createdBy,
        };
    }
    
    /**
     * Converts an array of Contact entities to an array of ContactDTOs.
     * @param contacts Contact entities to convert
     * @returns Array of ContactDTOs
     */
    toDTOs(contacts: Contact[]): ContactDTO[] {
        return contacts.map(this.toDTO);
    }

}
