/**
 * @module IContactMapper
 * @description Contract for mapping `Contact` domain entities to `ContactDTO` shapes.
 * Abstracts the mapping logic so consumers depend on the interface, not the implementation.
 */

import { ContactDTO } from "dto/ContactDTO.js";
import { Contact } from "generated/prisma/browser.js";

export interface IContactMapper {

    /**
     * Converts a single Contact entity to a ContactDTO.
     * @param contact Contact entity to convert
     * @returns Corresponding ContactDTO
     */
    toDTO(contact: Contact): ContactDTO;

    /**
     * Converts an array of Contact entities to an array of ContactDTOs.
     * @param contacts Contact entities to convert
     * @returns Array of ContactDTOs
     */
    toDTOs(contacts: Contact[]): ContactDTO[];
}

/** DI injection token for {@link IContactMapper}. */
export const CONTACT_MAPPER = Symbol.for("IContactMapper");
