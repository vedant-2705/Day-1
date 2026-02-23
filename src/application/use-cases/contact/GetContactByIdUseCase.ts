import { ContactDTO } from "@application/dto/ContactDTO.js";
import { CONTACT_REPOSITORY, type IContactRepository } from "@application/interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "@infrastructure/logging/Logger.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetContactByIdUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    async execute(id: string): Promise<ContactDTO> {
        const contact = await this.contactRepository.findById(id);

        if (!contact) {
            this.logger.warn(`Contact with ID ${id} not found`);
            throw new NotFoundError('Contact', id);
        }

        this.logger.info(`Retrieved contact with ID ${id}`);

        return contact;
    }
}

export const GET_CONTACT_BY_ID_USE_CASE = Symbol.for("GetContactByIdUseCase");