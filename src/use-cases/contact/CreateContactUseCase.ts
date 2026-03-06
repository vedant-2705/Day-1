import { ContactDTO } from "dto/ContactDTO.js";
import {
    CONTACT_REPOSITORY,
    type IContactRepository,
} from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { CreateContactDTO } from "validators/contactValidator.js";
import { ConflictError } from "shared/errors/ConflictError.js";
import { inject, injectable } from "tsyringe";
import { AuthUser } from "middlewares/AuthMiddleware.js";
import { CacheService } from "cache/CacheService.js";
import { CacheKeys } from "cache/CacheKeys.js";

/**
 * Use case: Create a new contact.
 *
 * Enforces the uniqueness invariant on email before persisting.
 * Throws {@link ConflictError} (409) if a contact with the same email already exists.
 *
 * Cache invalidation: after successful DB write, invalidates all list caches for this
 * user and the shared stats key. Invalidation runs AFTER the write succeeds and is
 * NOT wrapped in a try/catch that could swallow failures silently.
 */
@injectable()
export class CreateContactUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,

        @inject(CacheService)
        private readonly cache: CacheService,
    ) {}

    /**
     * @param input - Validated contact creation payload
     * @returns The newly created contact as a DTO
     * @throws {ConflictError} If a contact with the given email already exists
     */
    async execute(
        input: CreateContactDTO,
        authUser: AuthUser,
    ): Promise<ContactDTO> {
        // Guard: email must be unique across all contacts
        const existing = await this.contactRepository.findByEmail(input.email);
        if (existing) {
            throw new ConflictError(`CONTACT_EMAIL_CONFLICT`, {
                email: input.email,
            });
        }

        this.logger.info(`Creating contact with email: ${input.email}`);

        const contact = await this.contactRepository.create({
            ...input,
            createdBy: authUser.userId, // Associate contact with creator's user ID
        });

        this.logger.info(`Contact created with ID: ${contact.id}`);

        // Invalidate cache AFTER successful DB write.
        // Both invalidations run in parallel - neither blocks the response.
        // CacheService.invalidatePattern / del never throw, so failures are logged but non-fatal.
        await Promise.all([
            this.cache.invalidatePattern(
                CacheKeys.contactListPattern(authUser.userId),
            ),
            this.cache.del(CacheKeys.contactStats()),
        ]);

        return contact;
    }
}

/** DI injection token for {@link CreateContactUseCase}. */
export const CREATE_CONTACT_USE_CASE = Symbol.for("CreateContactUseCase");
