import { ContactDTO } from "dto/ContactDTO.js";
import { CONTACT_REPOSITORY, type IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { CreateContactDTO } from "validators/contactValidator.js";
import { ConflictError } from "shared/errors/ConflictError.js";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateContactUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    async execute(input: CreateContactDTO): Promise<ContactDTO> {
        const existing = await this.contactRepository.findByEmail(input.email);
        if (existing) {
            throw new ConflictError(`A contact with email '${input.email}' already exists`);
        }

        this.logger.info(`Creating contact with email: ${input.email}`);

        const contact = await this.contactRepository.create(input);

        this.logger.info(`Contact created with ID: ${contact.id}`);

        return contact;
    }
}

export const CREATE_CONTACT_USE_CASE = Symbol.for("CreateContactUseCase");