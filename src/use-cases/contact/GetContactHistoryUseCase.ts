/**
 * @module GetContactHistoryUseCase
 * @description Use case that retrieves the full audit trail for a single contact.
 * Performs an existence check before querying audit logs to ensure a clean 404
 * is returned when the contact does not exist, rather than an empty array that
 * could be ambiguous ("never changed" vs "does not exist").
 */

import { inject, injectable } from "tsyringe";
import {
    CONTACT_REPOSITORY,
    type IContactRepository,
} from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { AuditLog } from "generated/prisma/client.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

/**
 * Retrieves the full audit trail of a contact in reverse chronological order.
 *
 * @remarks
 * An explicit existence check is performed before querying audit logs.
 * This guarantees a 404 {@link NotFoundError} is thrown for unknown IDs rather
 * than silently returning an empty array, which would be indistinguishable from
 * a contact that exists but has never been modified.
 */
@injectable()
export class GetContactHistoryUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * Executes the use case.
     *
     * @param id - UUID of the contact whose audit history is requested.
     * @returns An array of {@link AuditLog} entries ordered newest first.
     * @throws {@link NotFoundError} if no active contact with the given ID exists.
     */
    async execute(id: string): Promise<AuditLog[]> {
        // Guard: verify the contact exists before querying audit logs.
        // Returns a clean 404 instead of an empty array that could be misread
        // as "contact exists but was never changed".
        const contact = await this.contactRepository.findById(id);

        if (!contact) {
            this.logger.warn(`Contact ${id} not found for history lookup`);
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        this.logger.info(`Fetching audit history for contact ${id}`);

        const history = await this.contactRepository.getAuditHistory(id);

        this.logger.info(
            `Found ${history.length} audit entries for contact ${id}`,
        );

        return history;
    }
}

/** DI injection token for {@link GetContactHistoryUseCase}. */
export const GET_CONTACT_HISTORY_USE_CASE = Symbol.for(
    "GetContactHistoryUseCase",
);
