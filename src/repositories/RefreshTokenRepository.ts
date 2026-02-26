import { inject, singleton } from "tsyringe";
import {
    IRefreshTokenRepository,
} from "interfaces/repositories/IRefreshTokenRepository.js";
import { DATABASE_CONNECTION, DatabaseConnection } from "database/DatabaseConnection.js";
import { RefreshToken } from "domain/entities/RefreshToken.js";
import { CreateRefreshTokenDTO } from "dto/RefreshTokenDTO.js";

@singleton()
export class RefreshTokenRepository implements IRefreshTokenRepository {
    constructor(
        @inject(DATABASE_CONNECTION)
        private readonly dbConnection: DatabaseConnection,
    ) {}

    /** Convenience accessor to avoid repeating `this.dbConnection.getClient()` throughout. */
    private get prisma() {
        return this.dbConnection.getClient();
    }

    async create(input: CreateRefreshTokenDTO): Promise<RefreshToken> {
        return await this.prisma.refreshToken.create({
            data: input,
        });
    }

    async findByTokenHash(hash: string): Promise<RefreshToken | null> {
        return this.prisma.refreshToken.findFirst({
            where: {
                tokenHash: hash,
                // Only return the row - caller decides what to do with revoked/expired tokens
                // We intentionally do NOT filter revokedAt/expiresAt here
                // because the use case needs to detect reuse of revoked tokens
            },
        });
    }

    async revokeByTokenHash(hash: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: {
                tokenHash: hash,
                revokedAt: null, // only update if not already revoked
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    async revokeAllByUserId(userId: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null, // only revoke currently active tokens
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    async deleteExpired(): Promise<number> {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }

    async countActiveSessions(userId: string): Promise<number> {
        return this.prisma.refreshToken.count({
            where: {
                userId,
                revokedAt: null,
                expiresAt: { gt: new Date() }, // not yet expired
            },
        });
    }
}