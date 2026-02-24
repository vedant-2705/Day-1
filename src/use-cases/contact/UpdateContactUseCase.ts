import { ContactDTO } from "dto/ContactDTO.js";
import { CONTACT_REPOSITORY, type IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { UpdateContactDTO } from "validators/contactValidator.js";
import { ConflictError } from "shared/errors/ConflictError.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";

@injectable()
export class UpdateContactUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    async execute(id: string, input: UpdateContactDTO): Promise<ContactDTO> {
        const { email } = input;
        this.logger.info(`Updating contact with ID: ${id}`);

        if(email) {
            const existing = await this.contactRepository.findByEmail(email as string);

            if (existing && existing.id !== id) {
                throw new ConflictError(`A contact with email '${input.email}' already exists`);
            }
        }

        const updated = await this.contactRepository.update(id, input);

        if (!updated) {
            this.logger.warn(`Contact with ID ${id} not found for update`);
            throw new NotFoundError(`Contact with ID '${id}' not found`);
        }

        this.logger.info(`Contact updated with ID: ${updated.id}`);

        return updated;
    }
}

export const UPDATE_CONTACT_USE_CASE = Symbol.for("UpdateContactUseCase");