/**
 * @module RefreshTokenDTO
 * @description Data Transfer Objects for refresh token persistence operations.
 * DTOs decouple the repository layer from the Prisma-generated types,
 * making the data contract explicit and independent of ORM implementation details.
 */

/**
 * Input shape for creating a new refresh token record.
 * Used by {@link IRefreshTokenRepository.create} after a successful login or token rotation.
 */
export interface CreateRefreshTokenDTO {
    /** The user this token is issued for. */
    userId: string;

    /**
     * SHA-256 hash of the raw token string.
     * The raw token is never stored - only the hash.
     */
    tokenHash: string;

    /** Optional browser / OS string parsed from the User-Agent header. */
    deviceInfo?: string | null;

    /** Client IP address at the time the token was issued. */
    ipAddress: string | null;

    /** Absolute expiry timestamp after which the token is no longer valid. */
    expiresAt: Date;
}