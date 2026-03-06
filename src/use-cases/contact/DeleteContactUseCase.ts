import { ErrorKeys } from "constants/ErrorCodes.js";
import { UserRole } from "domain/enum/UserRole.js";
import {
    CONTACT_REPOSITORY,
    type IContactRepository,
} from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { AuthUser } from "middlewares/AuthMiddleware.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";
import { CacheService } from "cache/CacheService.js";
import { CacheKeys } from "cache/CacheKeys.js";

/**
 * Use case: Soft-delete a contact by ID.
 *
 * Verifies existence and ownership before attempting deletion.
 * Throws {@link NotFoundError} (404) if the contact does not exist or is not owned
 * by the requesting user.
 *
 * Cache invalidation: after successful DB write, invalidates the list pattern,
 * the single-contact key, and the stats key. Runs AFTER the write - never inside
 * a try/catch that could swallow invalidation failures silently.
 */
@injectable()
export class DeleteContactUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,

        @inject(CacheService)
        private readonly cache: CacheService,
    ) {}

    /**
     * @param id - UUID of the contact to delete
     * @throws {NotFoundError} If no contact with the given ID exists or ownership check fails
     */
    async execute(id: string, authUser: AuthUser): Promise<void> {
        this.logger.info(`Attempting to delete contact with ID: ${id}`);

        // Guard: confirm the contact exists before issuing the delete
        const existingContact = await this.contactRepository.findById(id);

        if (!existingContact) {
            this.logger.warn(`Contact with ID ${id} not found for deletion`);
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        if (
            authUser.role === UserRole.USER &&
            existingContact.createdBy !== authUser.userId
        ) {
            this.logger.warn(
                `User ${authUser.userId} attempted to access contact ${id} owned by ${existingContact.createdBy}`,
            );
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        const deleted = await this.contactRepository.delete(id);

        // Secondary guard: handles race conditions where the record was removed between checks
        if (!deleted) {
            this.logger.warn(`Contact with ID ${id} not found for deletion`);
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        this.logger.info(`Contact deleted with ID: ${id}`);

        // Invalidate cache AFTER successful DB write.
        // Invalidate list, single entry, and stats - all in parallel.
        await Promise.all([
            this.cache.invalidatePattern(
                CacheKeys.contactListPattern(authUser.userId),
            ),
            this.cache.del(CacheKeys.contactById(id)),
            this.cache.del(CacheKeys.contactStats()),
        ]);
    }
}

/** DI injection token for {@link DeleteContactUseCase}. */
export const DELETE_CONTACT_USE_CASE = Symbol.for("DeleteContactUseCase");
