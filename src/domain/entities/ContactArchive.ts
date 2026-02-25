/**
 * @module ContactArchive
 * @description Domain entity representing a soft-deleted (archived) contact.
 * Extends the base {@link Contact} entity with archive-specific timestamps
 * to support data retention, audit trails, and potential restoration workflows.
 */

import { Contact } from "./Contact.js";

/**
 * Represents a contact that has been soft-deleted and moved to the archive.
 *
 * @remarks
 * Archived contacts are not physically removed from the database. Instead,
 * they are excluded from standard queries via the soft-delete Prisma extension.
 * This interface guarantees that both archive timestamps are present, making
 * it safe to use in contexts where archived records are explicitly queried
 * (e.g. the contact history or archive report endpoints).
 */
export interface ContactArchive extends Contact {
    /** Timestamp when the contact was soft-deleted (i.e. the `deletedAt` value set on the record). */
    deletedAt: Date;

    /** Timestamp when the contact record was physically moved into the archive view. */
    archivedAt: Date;
}