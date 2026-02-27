/**
 * @module PasswordResetTokenRepository
 * @description Concrete Prisma implementation of {@link IPasswordResetTokenRepository}.
 *
 * Tokens are stored as SHA-256 hashes - the plain token is never persisted.
 * Expired or used tokens are retained in the database rather than deleted,
 * providing an audit trail of reset attempts per user.
 */
import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import {
    DATABASE_CONNECTION,
    DatabaseConnection,
} from "database/DatabaseConnection.js";
import {
    IPasswordResetTokenRepository,
} from "interfaces/repositories/IPasswordResetTokenRepository.js";
import { PasswordResetToken } from "domain/entities/PasswordResetToken.js";

@singleton()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
    constructor(
        @inject(DATABASE_CONNECTION)
        private readonly dbConnection: DatabaseConnection,
    ) {}

    /** Convenience accessor - avoids repeating `this.dbConnection.getClient()` on every method. */
    private get prisma() {
        return this.dbConnection.getClient();
    }

    /** {@inheritDoc IPasswordResetTokenRepository.create} */
    async create(data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<PasswordResetToken> {
        return this.prisma.passwordResetToken.create({ data });
    }

    /**
     * {@inheritDoc IPasswordResetTokenRepository.findByTokenHash}
     *
     * @remarks
     * Does NOT filter by `usedAt` or `expiresAt` - the calling use case must
     * check those fields itself to distinguish between an expired token and a
     * replayed (already-used) one.
     */
    async findByTokenHash(hash: string): Promise<PasswordResetToken | null> {
        return this.prisma.passwordResetToken.findFirst({
            where: { tokenHash: hash },
        });
    }

    /** {@inheritDoc IPasswordResetTokenRepository.markAsUsed} */
    async markAsUsed(id: string): Promise<void> {
        await this.prisma.passwordResetToken.update({
            where: { id },
            data: { usedAt: new Date() },
        });
    }

    /**
     * {@inheritDoc IPasswordResetTokenRepository.invalidateAllForUser}
     *
     * @remarks
     * Tokens are soft-invalidated by setting `usedAt` rather than deleted.
     * This preserves the audit trail of how many reset attempts were made per user.
     */
    async invalidateAllForUser(userId: string): Promise<void> {
        await this.prisma.passwordResetToken.updateMany({
            where: {
                userId,
                usedAt: null, // only invalidate tokens that are still active
            },
            data: { usedAt: new Date() },
        });
    }

    /** {@inheritDoc IPasswordResetTokenRepository.deleteExpired} */
    async deleteExpired(): Promise<number> {
        const result = await this.prisma.passwordResetToken.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }
}
