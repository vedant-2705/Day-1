/**
 * @module AuditAction
 * @description Enumeration of all mutation types that can be recorded in the audit log.
 * Used as the `action` discriminator on {@link AuditLogEntry} to indicate what kind
 * of change was made to an audited entity.
 */

/**
 * Represents the category of write operation captured in an audit log entry.
 *
 * @remarks
 * - `CREATE` \u2014 a new entity was inserted into the database.
 * - `UPDATE` \u2014 one or more fields on an existing entity were modified.
 * - `DELETE` \u2014 an entity was removed (physically or soft-deleted via `deletedAt`).
 *
 * Soft-delete operations are recorded as `DELETE` rather than `UPDATE` because
 * the intent is removal, even though the underlying operation is an UPDATE query.
 */
export enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
}