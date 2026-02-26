import { RefreshToken } from 'domain/entities/RefreshToken.js';
import { CreateRefreshTokenDTO } from 'dto/RefreshTokenDTO.js';


export interface IRefreshTokenRepository {
    // Store a new refresh token after login or rotation
    create(data: CreateRefreshTokenDTO): Promise<RefreshToken>;

    // Find by hash - used on every refresh request
    findByTokenHash(hash: string): Promise<RefreshToken | null>;

    // Revoke single token - logout current device
    revokeByTokenHash(hash: string): Promise<void>;

    // Revoke all tokens for a user - logout all devices
    revokeAllByUserId(userId: string): Promise<void>;

    // Delete expired tokens - for cleanup cron job later
    deleteExpired(): Promise<number>;

    // Count active sessions - useful for dashboard/security info
    countActiveSessions(userId: string): Promise<number>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol.for("IRefreshTokenRepository");