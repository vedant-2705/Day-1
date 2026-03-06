import { ContactDTO } from "dto/ContactDTO.js";
import {
    CONTACT_REPOSITORY,
    type IContactRepository,
} from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { UpdateContactDTO } from "validators/contactValidator.js";
import { ConflictError } from "shared/errors/ConflictError.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";
import { AuthUser } from "middlewares/AuthMiddleware.js";
import { ErrorKeys } from "constants/ErrorCodes.js";
import { UserRole } from "domain/enum/UserRole.js";
import { CacheService } from "cache/CacheService.js";
import { CacheKeys } from "cache/CacheKeys.js";

/**
 * Use case: Update an existing contact by ID.
 *
 * If a new email is provided, enforces uniqueness - a contact cannot take an email
 * already owned by a *different* contact.
 *
 * Throws {@link ConflictError} (409) on email collision.
 * Throws {@link NotFoundError} (404) if the target contact does not exist.
 *
 * Cache invalidation: after successful DB write, invalidates the list pattern for this
 * user, the single-contact key, and the stats key. Runs AFTER write - never inside a
 * try/catch that could swallow invalidation failures silently.
 */
@injectable()
export class UpdateContactUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,

        @inject(CacheService)
        private readonly cache: CacheService,
    ) {}

    /**
     * @param id    - UUID of the contact to update
     * @param input - Partial or full update payload (validated)
     * @returns The updated contact as a DTO
     * @throws {ConflictError}  If the new email is already used by another contact
     * @throws {NotFoundError}  If no contact with the given ID exists
     */
    async execute(
        id: string,
        input: UpdateContactDTO,
        authUser: AuthUser,
    ): Promise<ContactDTO> {
        const { email } = input;
        this.logger.info(`Updating contact with ID: ${id}`);

        // Guard: only check email uniqueness when a new email is being set
        if (email) {
            const existing = await this.contactRepository.findByEmail(
                email as string,
            );

            // Allow the same contact to keep its own email (existing.id === id)
            if (existing && existing.id !== id) {
                throw new ConflictError(ErrorKeys.CONTACT_EMAIL_CONFLICT, {
                    email: input.email as string,
                });
            }
        }

        const contact = await this.contactRepository.findById(id);

        if (!contact) {
            this.logger.warn(`Contact with ID ${id} not found for update`);
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        if (
            authUser.role === UserRole.USER &&
            contact.createdBy !== authUser.userId
        ) {
            this.logger.warn(
                `User ${authUser.userId} attempted to access contact ${id} owned by ${contact.createdBy}`,
            );
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        const updated = await this.contactRepository.update(id, input);

        if (!updated) {
            this.logger.warn(`Contact with ID ${id} not found for update`);
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        this.logger.info(`Contact updated with ID: ${updated.id}`);

        // Invalidate cache AFTER successful DB write.
        // Invalidate list caches (sorted order / search may change), the single entry,
        // and the stats key - all in parallel.
        await Promise.all([
            this.cache.invalidatePattern(
                CacheKeys.contactListPattern(authUser.userId),
            ),
            this.cache.del(CacheKeys.contactById(id)),
            this.cache.del(CacheKeys.contactStats()),
        ]);

        return updated;
    }
}

/** DI injection token for {@link UpdateContactUseCase}. */
export const UPDATE_CONTACT_USE_CASE = Symbol.for("UpdateContactUseCase");
