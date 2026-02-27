/**
 * @module RefreshToken
 * @description Domain entity representing a persisted refresh token session.
 *
 * Each record maps to one active device/browser session for a user.
 * Tokens are stored as hashes - the raw token is never persisted.
 */
export interface RefreshToken {
    /** Unique record identifier (CUID). */
    id: string;

    /** The user this token belongs to. */
    userId: string;

    /**
     * SHA-256 hash of the raw refresh token.
     * Only the hash is stored so a database leak cannot be used to impersonate users.
     */
    tokenHash: string;

    /** Browser / OS info extracted from the User-Agent header at login time. */
    deviceInfo?: string | null;

    /** IP address recorded at login or last rotation. */
    ipAddress?: string | null;

    /** Absolute expiry timestamp; token must be rejected after this point. */
    expiresAt: Date;

    /**
     * Timestamp set when the token is explicitly revoked (logout / logout-all).
     * A non-null value means the token is invalid even if it has not expired.
     */
    revokedAt?: Date | null;

    /** Timestamp when this session record was first created. */
    createdAt: Date;
}