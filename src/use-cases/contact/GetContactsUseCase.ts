/**
 * @module GetContactsUseCase
 * @description Use case responsible for retrieving contacts from the repository.
 * Exposes three execution strategies to support both the simple v1 endpoint
 * (all contacts, no pagination) and the v2 endpoint (offset or cursor pagination
 * with optional search, filtering, and sorting).
 *
 * Cache-aside pattern applied to all three methods:
 *   1. Check Redis cache - return immediately on HIT
 *   2. On MISS - query DB, populate cache with TTL + jitter, return result
 */

import { UserRole } from "domain/enum/UserRole.js";
import { ContactDTO } from "dto/ContactDTO.js";
import {
    CONTACT_REPOSITORY,
    type IContactRepository,
} from "interfaces/repositories/IContactRepository.js";
import {
    ContactQueryParams,
    CursorPaginatedResult,
    OffsetPaginatedResult,
} from "lib/pagination/types.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { AuthUser } from "middlewares/AuthMiddleware.js";
import { inject, injectable } from "tsyringe";
import { CacheService } from "cache/CacheService.js";
import { CacheKeys, CacheTTL } from "cache/CacheKeys.js";

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

        @inject(CacheService)
        private readonly cache: CacheService,
    ) {}

    /**
     * v1: Returns all active contacts as a flat, unpaginated array.
     * Cache key encodes userId + pagination defaults to keep keys consistent.
     *
     * @returns Array of all {@link ContactDTO} objects; empty array if no contacts exist.
     */
    async execute(authUser: AuthUser): Promise<ContactDTO[]> {
        const ownerFilter = this.buildOwnerFilter(authUser);
        const cacheKey = CacheKeys.contactList(authUser.userId, {});

        // Cache lookup
        const cached = await this.cache.get<ContactDTO[]>(cacheKey);
        if (cached) {
            this.logger.debug("[GetContacts] Cache HIT", { cacheKey });
            return cached;
        }

        // Cache miss -> query DB
        this.logger.debug("[GetContacts] Cache MISS", { cacheKey });
        this.logger.info("Fetching all contacts from repository");

        const contacts = await this.contactRepository.findAll(ownerFilter);

        this.logger.info(`Retrieved ${contacts.length} contacts`);

        // Store in cache with TTL + (+/-)10% jitter to prevent thundering herd
        const ttl = CacheTTL.CONTACT_LIST + Math.floor(Math.random() * 12) - 6;
        await this.cache.set(cacheKey, contacts, ttl);

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
        const cacheKey = CacheKeys.contactList(authUser.userId, {
            page: params.page,
            limit: params.limit,
            search: params.search,
            sortField: params.sort?.[0]?.field,
            sortDir: params.sort?.[0]?.direction,
        });

        // Cache lookup
        const cached =
            await this.cache.get<OffsetPaginatedResult<ContactDTO>>(cacheKey);
        if (cached) {
            this.logger.debug("[GetContacts/Offset] Cache HIT", { cacheKey });
            return cached;
        }

        // Cache miss -> query DB
        this.logger.debug("[GetContacts/Offset] Cache MISS", { cacheKey });
        this.logger.info("Fetching contacts with offset pagination", params);

        const ownerFilter = this.buildOwnerFilter(authUser);
        const result = await this.contactRepository.findAllWithOffset({
            ...params,
            ...ownerFilter,
        });

        // Cache with TTL + jitter
        const ttl = CacheTTL.CONTACT_LIST + Math.floor(Math.random() * 12) - 6;
        await this.cache.set(cacheKey, result, ttl);

        return result;
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
        const cacheKey = CacheKeys.contactList(authUser.userId, {
            limit: params.limit,
            search: params.search,
            sortField: params.sort?.[0]?.field,
            sortDir: params.sort?.[0]?.direction,
            cursor: params.cursor,
        });

        // Cache lookup
        const cached =
            await this.cache.get<CursorPaginatedResult<ContactDTO>>(cacheKey);
        if (cached) {
            this.logger.debug("[GetContacts/Cursor] Cache HIT", { cacheKey });
            return cached;
        }

        // Cache miss -> query DB
        this.logger.debug("[GetContacts/Cursor] Cache MISS", { cacheKey });
        this.logger.info("Fetching contacts with cursor pagination", params);

        const ownerFilter = this.buildOwnerFilter(authUser);
        const result = await this.contactRepository.findAllWithCursor({
            ...params,
            ...ownerFilter,
        });

        // Cache with TTL + jitter
        const ttl = CacheTTL.CONTACT_LIST + Math.floor(Math.random() * 12) - 6;
        await this.cache.set(cacheKey, result, ttl);

        return result;
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
