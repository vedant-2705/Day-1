import "reflect-metadata";
import { ContactDTO } from "dto/ContactDTO.js";
import { IContactMapper } from "interfaces/mapper/IContactMapper.js";
import { Contact } from "domain/entities/Contact.js";
import { injectable } from "tsyringe";

@injectable()
export class ContactMapper implements IContactMapper {
    toDTO(contact: Contact): ContactDTO {
        return {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
        };
    }
    
    toDTOs(contacts: Contact[]): ContactDTO[] {
        return contacts.map(this.toDTO);
    }

}
