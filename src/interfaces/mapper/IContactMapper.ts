import { ContactDTO } from "dto/ContactDTO.js";
import { Contact } from "generated/prisma/browser.js";

export interface IContactMapper {
    toDTO(contact: Contact): ContactDTO;
    toDTOs(contacts: Contact[]): ContactDTO[];
}

export const CONTACT_MAPPER = Symbol.for("IContactMapper");
