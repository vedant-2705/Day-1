import { ContactDTO } from "dto/ContactDTO.js";
import { CONTACT_REPOSITORY, type IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetContactsUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    async execute(): Promise<ContactDTO[]> {
        this.logger.info("Fetching all contacts from repository");

        const contacts = await this.contactRepository.findAll();

        this.logger.info(`Retrieved ${contacts.length} contacts`);

        return contacts;
    }
}

export const GET_CONTACTS_USE_CASE = Symbol.for("GetContactsUseCase");