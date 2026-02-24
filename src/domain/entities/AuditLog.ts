import { AuditAction } from "domain/enum/AuditAction.js";

export interface AuditLogEntry {
    entityType: string;
    entityId: string;
    action: AuditAction;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    performedBy?: string;
    ipAddress?: string;
    userAgent?: string;
}
