import { ContactDTO } from "dto/ContactDTO.js";
import { CONTACT_REPOSITORY, type IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";

/**
 * Use case: Retrieve a single contact by its unique ID.
 *
 * Throws {@link NotFoundError} (404) if no contact with the given ID exists.
 */
@injectable()
export class GetContactByIdUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * @param id - UUID of the contact to retrieve
     * @returns The matching contact as a DTO
     * @throws {NotFoundError} If no contact with the given ID exists
     */
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

/** DI injection token for {@link GetContactByIdUseCase}. */
export const GET_CONTACT_BY_ID_USE_CASE = Symbol.for("GetContactByIdUseCase");