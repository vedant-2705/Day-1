/**
 * @module ContactRepository
 * @description Prisma-backed implementation of {@link IContactRepository}.
 * Uses raw SQL (`$queryRaw`) for operations that require features not yet
 * supported by the Prisma query builder with the pg adapter (e.g. COALESCE updates).
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { DATABASE_CONNECTION, DatabaseConnection } from "database/DatabaseConnection.js";
import { IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { CreateContactDTO, UpdateContactDTO } from "validators/contactValidator.js";
import { ContactDTO } from "dto/ContactDTO.js";
import { CONTACT_MAPPER, type IContactMapper } from "interfaces/mapper/IContactMapper.js";
import { CursorPaginator } from "lib/pagination/CursorPaginator.js";
import { ContactQueryParams, CursorPaginatedResult, OffsetPaginatedResult } from "lib/pagination/types.js";
import { OffsetPaginator } from "lib/pagination/OffsetPaginator.js";
import { SortBuilder } from "lib/pagination/SortBuilder.js";
import { AuditLog } from "generated/prisma/client.js";

@injectable()
export class ContactRepository implements IContactRepository {
    constructor(
        @inject(DATABASE_CONNECTION)
        private readonly dbConnection: DatabaseConnection,

        @inject(CONTACT_MAPPER)
        private readonly contactMapper: IContactMapper
    ) {}

    /** Convenience accessor to avoid repeating `this.dbConnection.getClient()` throughout. */
    private get prisma() {
        return this.dbConnection.getClient();
    }

    /**
     * Retrieves all non-deleted contacts from the database.
     *
     * @returns An array of {@link ContactDTO} objects. Returns an empty array if no contacts exist.
     *
     * @remarks
     * The soft-delete Prisma extension automatically injects `deletedAt: null` into
     * this query, so archived contacts are never included in the result.
     */
    async findAll(): Promise<ContactDTO[]> {
        const contacts = await this.prisma.contact.findMany();
        // const contacts: Contact[] = await this.prisma.$queryRaw`SELECT * FROM "contacts"`;
        
        return this.contactMapper.toDTOs(contacts);
    }

    /**
     * Finds an active contact by email address.
     *
     * @param email - The email address to look up (case-sensitive exact match).
     * @returns The matching {@link ContactDTO}, or `null` if no active contact with that email exists.
     */
    async findByEmail(email: string): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.findFirst({
            where: {
                email,
            },
        });

        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    /**
     * Finds an active contact by its unique identifier.
     *
     * @param id - UUID of the contact to retrieve.
     * @returns The matching {@link ContactDTO}, or `null` if no active contact with that ID exists.
     */
    async findById(id: string): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.findFirst({
            where: {
                id,
            },
        });
        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    /**
     * Persists a new contact record to the database.
     *
     * @param input - Validated contact creation payload containing name, email, phone, and address.
     * @returns The {@link ContactDTO} representing the newly created contact, including its generated ID.
     */
    async create(input: CreateContactDTO & { createdBy: string }): Promise<ContactDTO> {
        const contact = await this.prisma.contact.create({
            data: {
                ...input,
                createdBy: input.createdBy, // Associate contact with creator's user ID
            },
        });

        return this.contactMapper.toDTO(contact);
    }

    /**
     * Updates an existing contact with the provided fields.
     *
     * @param id    - UUID of the contact to update.
     * @param input - Partial update payload; only supplied fields are written.
     * @returns The updated {@link ContactDTO}, or `null` if the contact does not exist.
     *
     * @remarks
     * The `version` field is atomically incremented on every update to support
     * optimistic concurrency control on the client side.
     */
    async update(id: string, input: UpdateContactDTO): Promise<ContactDTO | null> {
        const contact = await this.prisma.contact.update({
            where: { id },
            data: { ...input, version: { increment: 1 } },
        });

        // const { name, email, phone, address } = input;

        // const contacts: Contact[] = await this.prisma.$queryRaw`UPDATE "contacts" SET
        //     name = COALESCE(${name}, name),
        //     email = COALESCE(${email}, email),
        //     phone = COALESCE(${phone}, phone),
        //     address = COALESCE(${address}, address),
        //     "updatedAt" = CURRENT_TIMESTAMP,
        //     "version" = version + 1
        //     WHERE id = ${id} RETURNING *`;

        // const contact = contacts[0];

        return contact ? this.contactMapper.toDTO(contact) : null;
    }

    /**
     * Soft-deletes a contact by setting its `deletedAt` timestamp to the current time.
     *
     * @param id - UUID of the contact to archive.
     * @returns `true` if the contact was successfully soft-deleted, `false` otherwise.
     *
     * @remarks
     * This is a soft delete - the record is retained in the database with `deletedAt` set.
     * The soft-delete Prisma extension will automatically exclude it from all subsequent
     * read queries. The audit extension records this operation as a `DELETE` action.
     */
    async delete(id: string): Promise<boolean> {
 
        // const contact = await this.prisma.contact.delete({
        //     where: {
        //         id,
        //     },
        // });

        const contact = await this.prisma.contact.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return contact ? true : false;
    }

    /**
     * Builds the shared Prisma `where` clause used by both paginated query methods.
     *
     * @param params - The unified query parameters from the controller.
     * @returns A Prisma-compatible `where` object, or an empty object if no filters are active.
     *
     * @remarks
     * - `search` is applied as a case-insensitive OR across `name` and `email`.
     * - `name` and `email` filters are independent case-insensitive substring matches.
     * - All active conditions are combined with `AND`, so multiple filters narrow the result set.
     * Extracted into a private method to avoid duplicating the same logic in
     * both {@link findAllWithOffset} and {@link findAllWithCursor}.
     */
    private buildContactWhere(params: ContactQueryParams): object {
        const { search, name, email } = params;
        const conditions: object[] = [];

        // search: case-insensitive fuzzy match across BOTH name and email simultaneously.
        // A contact is included if EITHER field contains the search string.
        if (search) {
            conditions.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        // name: independent case-insensitive substring filter, applied in addition to search
        if (name) {
            conditions.push({ name: { contains: name, mode: 'insensitive' } });
        }

        // email: independent case-insensitive substring filter, applied in addition to search
        if (email) {
            conditions.push({ email: { contains: email, mode: 'insensitive' } });
        }

        return conditions.length > 0 ? { AND: conditions } : {};
    }

    /**
     * Retrieves contacts using offset (page/limit) pagination with optional search, filter, and sort.
     *
     * @param params - Unified query parameters including page, limit, search, filters, and sort.
     * @returns An {@link OffsetPaginatedResult} containing the requested page of contacts and metadata.
     *
     * @remarks
     * The total count and data queries are executed in parallel via `Promise.all`
     * to minimise round-trip latency.
     */
    async findAllWithOffset(
        params: ContactQueryParams,
    ): Promise<OffsetPaginatedResult<ContactDTO>> {
        console.log(params);
        const where = this.buildContactWhere(params);
        const orderBy = SortBuilder.toPrismaOrderBy(
            params.sort ?? [{ field: 'createdAt', direction: 'desc' }],
        );
        const { skip, take } = OffsetPaginator.getPrismaArgs({
            page: params.page ?? 1,
            limit: params.limit ?? 10,
        });

        console.log("Where clause:", where);
        console.log("Order By clause:", orderBy);

        // Run the COUNT and data queries in parallel - they are independent
        // and running them sequentially would double the round-trip time.
        const [total, contacts] = await Promise.all([
            this.prisma.contact.count({ where }),
            this.prisma.contact.findMany({ where, orderBy, skip, take }),
        ]);

        return OffsetPaginator.buildResult(
            this.contactMapper.toDTOs(contacts),
            { page: params.page ?? 1, limit: params.limit ?? 10 },
            total,
        );
    }

    /**
     * Retrieves contacts using cursor (keyset) pagination with optional search, filter, and sort.
     *
     * @param params - Unified query parameters including cursor token, limit, direction, search, filters, and sort.
     * @returns A {@link CursorPaginatedResult} containing the requested page of contacts and cursor metadata.
     *
     * @remarks
     * User-supplied filters (`buildContactWhere`) and the cursor's keyset WHERE condition are
     * ANDed together so both constraints are enforced in a single query.
     */
    async findAllWithCursor(
        params: ContactQueryParams,
    ): Promise<CursorPaginatedResult<ContactDTO>> {
        const userWhere = this.buildContactWhere(params);
        const { where: cursorWhere, orderBy, take } = CursorPaginator.getPrismaArgs({
            cursor: params.cursor,
            limit: params.limit ?? 10,
            direction: params.direction ?? 'forward',
            sort: params.sort,
        });

        console.log(orderBy);

        // Merge user-supplied filters with the cursor keyset condition.
        // Both constraints must be satisfied simultaneously, so they are ANDed together.
        const where =
            Object.keys(cursorWhere).length > 0
                ? { AND: [userWhere, cursorWhere] }
                : userWhere;

        const contacts = await this.prisma.contact.findMany({
            where,
            orderBy,
            take,
        });

        // CursorPaginator.buildResult requires { id, createdAt } on each row.
        // ContactDTO includes both fields, so the cast is safe.
        return CursorPaginator.buildResult(
            this.contactMapper.toDTOs(contacts) as (ContactDTO & { id: string; createdAt: Date })[],
            {
                cursor: params.cursor,
                limit: params.limit ?? 10,
                direction: params.direction ?? 'forward',
                sort: params.sort,
            },
        );
    }

    /**
     * Returns all audit log entries for a specific contact, ordered newest first.
     *
     * @param contactId - UUID of the contact whose change history is being requested.
     * @returns An array of raw {@link AuditLog} records in descending chronological order.
     */
    async getAuditHistory(contactId: string): Promise<AuditLog[]> {
        return this.prisma.auditLog.findMany({
            where: {
                entityType: 'Contact',
                entityId: contactId,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Returns raw aggregate statistics used by the contact reports endpoint.
     *
     * @returns An object containing total active contacts, contacts created today, and
     *          the top 10 email domains ranked by contact count.
     *
     * @remarks
     * All three queries are executed in parallel via `Promise.all` since none depend
     * on each other. UTC boundaries are used for "today" to ensure consistency
     * regardless of the server's local timezone. Domain extraction uses `SPLIT_PART`
     * via `$queryRaw` because Prisma's query builder does not support substring
     * grouping natively with the pg adapter.
     */
    async getContactStats(): Promise<{
        total: number;
        addedToday: number;
        domainCounts: { domain: string; count: number }[];
    }> {
        // Compute UTC boundaries for "today".
        // Always use UTC in the database layer - never rely on the server's local timezone.
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setUTCHours(23, 59, 59, 999);

        // Execute all three queries in parallel - none depend on each other.
        const [total, addedToday, domainRows] = await Promise.all([

            // Total active contacts (soft delete extension auto-adds deletedAt: null)
            this.prisma.contact.count(),

            // Contacts created today
            this.prisma.contact.count({
                where: {
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),

            // Domain counts - Prisma cannot perform substring-based GROUP BY natively,
            // so we use parameterized $queryRaw (safe from SQL injection).
            // SPLIT_PART(email, '@', 2) extracts the domain portion of each email address.
            this.prisma.$queryRaw<{ domain: string; count: bigint }[]>`
                SELECT
                    SPLIT_PART(email, '@', 2) AS domain,
                    COUNT(*)::bigint          AS count
                FROM contacts
                WHERE "deletedAt" IS NULL
                GROUP BY domain
                ORDER BY count DESC
                LIMIT 10
            `,
        ]);

        return {
            total,
            addedToday,
            // $queryRaw returns COUNT as BigInt - convert to a plain number before returning
            domainCounts: domainRows.map(row => ({
                domain: row.domain,
                count: Number(row.count),
            })),
        };
    }
}