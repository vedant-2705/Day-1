/**
 * @module RefreshTokenRepository
 * @description Concrete Prisma implementation of {@link IRefreshTokenRepository}.
 *
 * All write operations work against the token **hash** - the raw token string is
 * never persisted. `findByTokenHash` intentionally omits `revokedAt`/`expiresAt`
 * filters so that the calling use case can detect and respond to reuse of
 * already-revoked tokens (token-reuse detection pattern).
 */
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

    /** Convenience accessor - avoids repeating `this.dbConnection.getClient()` on every method. */
    private get prisma() {
        return this.dbConnection.getClient();
    }

    /** {@inheritDoc IRefreshTokenRepository.create} */
    async create(input: CreateRefreshTokenDTO): Promise<RefreshToken> {
        return await this.prisma.refreshToken.create({
            data: input,
        });
    }

    /**
     * {@inheritDoc IRefreshTokenRepository.findByTokenHash}
     *
     * @remarks
     * Does NOT filter by `revokedAt` or `expiresAt` - the use case must check
     * those fields itself so it can distinguish a legitimately expired token from
     * a reused/revoked one and respond accordingly.
     */
    async findByTokenHash(hash: string): Promise<RefreshToken | null> {
        return this.prisma.refreshToken.findFirst({
            where: { tokenHash: hash },
        });
    }

    /** {@inheritDoc IRefreshTokenRepository.revokeByTokenHash} */
    async revokeByTokenHash(hash: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: {
                tokenHash: hash,
                revokedAt: null, // no-op if already revoked
            },
            data: { revokedAt: new Date() },
        });
    }

    /** {@inheritDoc IRefreshTokenRepository.revokeAllByUserId} */
    async revokeAllByUserId(userId: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null, // only revoke currently active tokens
            },
            data: { revokedAt: new Date() },
        });
    }

    /** {@inheritDoc IRefreshTokenRepository.deleteExpired} */
    async deleteExpired(): Promise<number> {
        const result = await this.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        return result.count;
    }

    /** {@inheritDoc IRefreshTokenRepository.countActiveSessions} */
    async countActiveSessions(userId: string): Promise<number> {
        return this.prisma.refreshToken.count({
            where: {
                userId,
                revokedAt: null,
                expiresAt: { gt: new Date() }, // exclude expired sessions
            },
        });
    }

    /** {@inheritDoc IRefreshTokenRepository.revokeAllExcept} */
    async revokeAllExcept(userId: string, currentTokenHash: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,           // only active sessions
                tokenHash: {
                    not: currentTokenHash, // skip the current session
                },
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }
}