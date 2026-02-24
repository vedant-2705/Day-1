import { ContactDTO } from "dto/ContactDTO.js";
import { CONTACT_REPOSITORY, type IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { UpdateContactDTO } from "validators/contactValidator.js";
import { ConflictError } from "shared/errors/ConflictError.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";

/**
 * Use case: Update an existing contact by ID.
 *
 * If a new email is provided, enforces uniqueness — a contact cannot take an email
 * already owned by a *different* contact.
 *
 * Throws {@link ConflictError} (409) on email collision.
 * Throws {@link NotFoundError} (404) if the target contact does not exist.
 */
@injectable()
export class UpdateContactUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * @param id    - UUID of the contact to update
     * @param input - Partial or full update payload (validated)
     * @returns The updated contact as a DTO
     * @throws {ConflictError}  If the new email is already used by another contact
     * @throws {NotFoundError}  If no contact with the given ID exists
     */
    async execute(id: string, input: UpdateContactDTO): Promise<ContactDTO> {
        const { email } = input;
        this.logger.info(`Updating contact with ID: ${id}`);

        // Guard: only check email uniqueness when a new email is being set
        if(email) {
            const existing = await this.contactRepository.findByEmail(email as string);

            // Allow the same contact to keep its own email (existing.id === id)
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

/** DI injection token for {@link UpdateContactUseCase}. */
export const UPDATE_CONTACT_USE_CASE = Symbol.for("UpdateContactUseCase");