import { DATABASE_CONNECTION, DatabaseConnection } from "database/DatabaseConnection.js";
import { AuditLogEntry } from "domain/entities/AuditLog.js";
import { Prisma } from "generated/prisma/client.js";
import { inject, injectable } from "tsyringe";

@injectable()
export class AuditLogService {
    constructor(
        @inject(DATABASE_CONNECTION)
        private readonly dbConnection: DatabaseConnection
    ) {}

    private get prisma() {
        return this.dbConnection.getClient();
    }

    async log(entry: AuditLogEntry): Promise<void> {
        await this.prisma.auditLog.create({
            data: {
                entityType: entry.entityType,
                entityId: entry.entityId,
                action: entry.action,
                oldData: entry.oldData == null ? Prisma.JsonNull : entry.oldData as Prisma.InputJsonValue,
                newData: entry.newData == null ? Prisma.JsonNull : entry.newData as Prisma.InputJsonValue,
                performedBy: entry.performedBy ?? 'system',
                ipAddress: entry.ipAddress,
                userAgent: entry.userAgent,
            },
        })
    }

    // Query audit history for a specific record
    async getHistory(entityType: string, entityId: string) {
        return this.prisma.auditLog.findMany({
            where: { entityType, entityId },
            orderBy: { createdAt: 'desc' },
        });
    }
}