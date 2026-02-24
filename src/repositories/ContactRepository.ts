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

    private get prisma() {
        return this.dbConnection.getClient();
    }

    async findAll(): Promise<ContactDTO[]> {
        const contacts = await this.prisma.contact.findMany();
        
        return this.contactMapper.toDTOs(contacts);
    }

    async findByEmail(email: string): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.findUnique({
            where: {
                email,
            },
        });

        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    async findById(id: string): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.findUnique({
            where: {
                id,
            },
        });
        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    async create(input: CreateContactDTO): Promise<ContactDTO> {
        const contact = await this.prisma.contact.create({
            data: input,
        });

        return this.contactMapper.toDTO(contact);
    }

    async update(id: string, input: UpdateContactDTO): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.update({
            where: {
                id,
            },
            data: input,
        });

        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    async delete(id: string): Promise<boolean> {
 
        const contact = await this.prisma.contact.delete({
            where: {
                id,
            },
        });

        return contact ? true : false;
    }
}