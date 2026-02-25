import { CONTACT_REPOSITORY, type IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";

/**
 * Use case: Permanently delete a contact by ID.
 *
 * Verifies existence before attempting deletion.
 * Throws {@link NotFoundError} (404) if the contact does not exist at either check.
 */
@injectable()
export class DeleteContactUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * @param id - UUID of the contact to delete
     * @throws {NotFoundError} If no contact with the given ID exists
     */
    async execute(id: string): Promise<void> {
        this.logger.info(`Attempting to delete contact with ID: ${id}`);

        // Guard: confirm the contact exists before issuing the delete
        const existingContact = await this.contactRepository.findById(id);

        if (!existingContact) {
            this.logger.warn(`Contact with ID ${id} not found for deletion`);
            throw new NotFoundError(`CONTACT_NOT_FOUND`, { id });
        }

        const deleted = await this.contactRepository.delete(id);

        // Secondary guard: handles race conditions where the record was removed between checks
        if (!deleted) {
            this.logger.warn(`Contact with ID ${id} not found for deletion`);
            throw new NotFoundError(`CONTACT_NOT_FOUND`, { id });
        }
        this.logger.info(`Contact deleted with ID: ${id}`);
    }
}

/** DI injection token for {@link DeleteContactUseCase}. */
export const DELETE_CONTACT_USE_CASE = Symbol.for("DeleteContactUseCase");