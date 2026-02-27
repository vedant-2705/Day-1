/**
 * @module IRefreshTokenRepository
 * @description Defines the persistence contract for refresh token session management.
 *
 * Refresh tokens are stored as hashed values so that a database compromise cannot
 * be used to replay tokens. All write operations work against the hash, never the
 * raw token string.
 */
import { RefreshToken } from 'domain/entities/RefreshToken.js';
import { CreateRefreshTokenDTO } from 'dto/RefreshTokenDTO.js';

export interface IRefreshTokenRepository {
    /**
     * Persists a new refresh token record after a successful login or token rotation.
     *
     * @param data DTO containing the token hash, user ID, device info, and expiry.
     * @returns The newly created {@link RefreshToken} record.
     */
    create(data: CreateRefreshTokenDTO): Promise<RefreshToken>;

    /**
     * Looks up a refresh token by its hash.
     * Called on every `/auth/refresh` request to validate the incoming token.
     *
     * @param hash SHA-256 hash of the raw token string.
     * @returns The matching {@link RefreshToken}, or `null` if not found.
     */
    findByTokenHash(hash: string): Promise<RefreshToken | null>;

    /**
     * Revokes a single refresh token, logging out the current device/session.
     *
     * @param hash SHA-256 hash of the token to revoke.
     */
    revokeByTokenHash(hash: string): Promise<void>;

    /**
     * Revokes all active refresh tokens for a given user, logging out all devices.
     * Triggered by the `/auth/logout-all` endpoint.
     *
     * @param userId The ID of the user whose sessions should be terminated.
     */
    revokeAllByUserId(userId: string): Promise<void>;

    /**
     * Hard-deletes all tokens whose `expiresAt` is in the past.
     * Intended to be called by a scheduled cleanup job to keep the table lean.
     *
     * @returns The number of records deleted.
     */
    deleteExpired(): Promise<number>;

    /**
     * Returns the number of non-revoked, non-expired sessions for a user.
     * Useful for security dashboards or enforcing a per-user session limit.
     *
     * @param userId The ID of the user to query.
     * @returns The count of currently active sessions.
     */
    countActiveSessions(userId: string): Promise<number>;
}

/** DI token used to resolve {@link IRefreshTokenRepository} from the tsyringe container. */
export const REFRESH_TOKEN_REPOSITORY = Symbol.for("IRefreshTokenRepository");