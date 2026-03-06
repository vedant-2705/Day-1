import { ErrorKeys } from "constants/ErrorCodes.js";
import { ContactDTO } from "dto/ContactDTO.js";
import { UserRole } from "generated/prisma/enums.js";
import {
    CONTACT_REPOSITORY,
    type IContactRepository,
} from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { AuthUser } from "middlewares/AuthMiddleware.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";
import { CacheService } from "cache/CacheService.js";
import { CacheKeys, CacheTTL } from "cache/CacheKeys.js";

/**
 * Use case: Retrieve a single contact by its unique ID.
 *
 * Cache-aside pattern: check Redis first, fall back to DB on miss.
 * Ownership is ALWAYS validated after retrieval (whether from cache or DB)
 * to prevent a user from accessing another user's data via a stale cache key.
 *
 * Throws {@link NotFoundError} (404) if no contact with the given ID exists
 * or if the requesting user does not own the contact.
 */
@injectable()
export class GetContactByIdUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,

        @inject(CacheService)
        private readonly cache: CacheService,
    ) {}

    /**
     * @param id - UUID of the contact to retrieve
     * @returns The matching contact as a DTO
     * @throws {NotFoundError} If no contact with the given ID exists or ownership check fails
     */
    async execute(id: string, authUser: AuthUser): Promise<ContactDTO> {
        const cacheKey = CacheKeys.contactById(id);

        // Cache lookup
        const cached = await this.cache.get<ContactDTO>(cacheKey);

        let contact: ContactDTO | null;

        if (cached) {
            this.logger.debug("[GetContactById] Cache HIT", { cacheKey });
            contact = cached;
        } else {
            // Cache miss -> query DB
            this.logger.debug("[GetContactById] Cache MISS", { cacheKey });
            contact = await this.contactRepository.findById(id);

            if (contact) {
                // Populate cache - TTL + (+/-)10% jitter
                const ttl =
                    CacheTTL.CONTACT_SINGLE +
                    Math.floor(Math.random() * 24) -
                    12;
                await this.cache.set(cacheKey, contact, ttl);
            }
        }

        // Ownership and existence checks always run - whether data came from cache or DB
        if (!contact) {
            this.logger.warn(`Contact with ID ${id} not found`);
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

        this.logger.info(`Retrieved contact with ID ${id}`);

        return contact;
    }
}

/** DI injection token for {@link GetContactByIdUseCase}. */
export const GET_CONTACT_BY_ID_USE_CASE = Symbol.for("GetContactByIdUseCase");
