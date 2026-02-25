/**
 * @module AuditLog
 * @description Domain entity representing a single audit log entry.
 * An audit log entry captures the who, what, and when of every mutating
 * operation performed on an audited entity, providing a full change history
 * for compliance, debugging, and data recovery purposes.
 */

import { AuditAction } from "domain/enum/AuditAction.js";

/**
 * Represents the data required to record one auditable event.
 *
 * @remarks
 * This interface is used as the input shape when creating audit log records.
 * `oldData` and `newData` store JSON snapshots of the entity state before and
 * after the operation, enabling full before/after diffing.
 * For bulk operations, `entityId` is set to `"bulk"` and `oldData` contains
 * the filter criteria used rather than a single entity snapshot.
 */
export interface AuditLogEntry {
    /** The Prisma model name of the entity being audited (e.g. `"Contact"`). */
    entityType: string;

    /** The primary key value of the affected entity, or `"bulk"` for batch operations. */
    entityId: string;

    /** The type of mutation that triggered this audit entry. */
    action: AuditAction;

    /** Snapshot of the entity's state immediately before the mutation. `null` for CREATE operations. */
    oldData?: Record<string, unknown> | null;

    /** Snapshot of the entity's state immediately after the mutation. `null` for hard DELETE operations. */
    newData?: Record<string, unknown> | null;

    /** Identifier of the actor (user ID, service account, or `"system"`) that triggered the operation. */
    performedBy?: string;

    /** IP address of the client that initiated the request, if available. */
    ipAddress?: string;

    /** User-Agent header of the client that initiated the request, if available. */
    userAgent?: string;
}
