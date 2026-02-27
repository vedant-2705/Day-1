/**
 * @module GetContactsUseCase
 * @description Use case responsible for retrieving contacts from the repository.
 * Exposes three execution strategies to support both the simple v1 endpoint
 * (all contacts, no pagination) and the v2 endpoint (offset or cursor pagination
 * with optional search, filtering, and sorting).
 */

import { UserRole } from "domain/enum/UserRole.js";
import { ContactDTO } from "dto/ContactDTO.js";
import { CONTACT_REPOSITORY, type IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { ContactQueryParams, CursorPaginatedResult, OffsetPaginatedResult } from "lib/pagination/types.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { AuthUser } from "middlewares/AuthMiddleware.js";
import { inject, injectable } from "tsyringe";

/**
 * Use case: retrieve contacts from the repository.
 *
 * @remarks
 * Never throws for an empty result set - an empty array is a valid, expected response.
 * Three execution methods cover the two API versions:
 * - `execute` - v1 flat list, no pagination.
 * - `executeWithOffset` - v2 page/limit pagination.
 * - `executeWithCursor` - v2 keyset pagination (default for v2).
 */
@injectable()
export class GetContactsUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * v1: Returns all active contacts as a flat, unpaginated array.
     *
     * @returns Array of all {@link ContactDTO} objects; empty array if no contacts exist.
     */
    async execute(authUser: AuthUser): Promise<ContactDTO[]> {
        this.logger.info("Fetching all contacts from repository");

        const ownerFilter = this.buildOwnerFilter(authUser);

        const contacts = await this.contactRepository.findAll(ownerFilter);

        this.logger.info(`Retrieved ${contacts.length} contacts`);

        return contacts;
    }

    /**
     * v2: Retrieves contacts using offset (page/limit) pagination with optional search, filter, and sort.
     *
     * @param params - Validated query parameters from the v2 controller.
     * @returns An {@link OffsetPaginatedResult} containing the requested page and metadata.
     */
    async executeWithOffset(
        params: ContactQueryParams,
        authUser: AuthUser,
    ): Promise<OffsetPaginatedResult<ContactDTO>> {
        this.logger.info('Fetching contacts with offset pagination', params);
        const ownerFilter = this.buildOwnerFilter(authUser);
        return this.contactRepository.findAllWithOffset({
            ...params,
            ...ownerFilter,
        });
    }

    /**
     * v2: Retrieves contacts using cursor (keyset) pagination with optional search, filter, and sort.
     * This is the default pagination mode for v2 and is preferred for large datasets.
     *
     * @param params - Validated query parameters from the v2 controller.
     * @returns A {@link CursorPaginatedResult} containing the requested page and cursor metadata.
     */
    async executeWithCursor(
        params: ContactQueryParams,
        authUser: AuthUser,
    ): Promise<CursorPaginatedResult<ContactDTO>> {
        this.logger.info('Fetching contacts with cursor pagination', params);
        const ownerFilter = this.buildOwnerFilter(authUser);
        return this.contactRepository.findAllWithCursor({
            ...params,
            ...ownerFilter,
        });
    }

    // ADMIN  -> no filter, sees everything
    // USER   -> createdBy filter, sees only their own contacts
    private buildOwnerFilter(authUser: AuthUser): Partial<ContactQueryParams> {
        if (authUser.role === UserRole.ADMIN) {
            return {};
        }
        return { createdBy: authUser.userId };
    }
}

/** DI injection token for {@link GetContactsUseCase}. */
export const GET_CONTACTS_USE_CASE = Symbol.for("GetContactsUseCase");