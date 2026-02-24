import { ContactDTO } from "dto/ContactDTO.js";
import {
    CreateContactDTO,
    UpdateContactDTO,
} from "validators/contactValidator.js";

export interface IContactRepository {
    findAll(): Promise<ContactDTO[]>;
    findById(id: string): Promise<ContactDTO | null>;
    findByEmail(email: string): Promise<ContactDTO | null>;
    create(input: CreateContactDTO): Promise<ContactDTO>;
    update(id: string, input: UpdateContactDTO): Promise<ContactDTO | null>;
    delete(id: string): Promise<boolean>;
}

export const CONTACT_REPOSITORY = Symbol.for("IContactRepository");
