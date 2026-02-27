/**
 * @module PasswordResetToken
 * @description Domain entity representing a single-use password reset token record.
 *
 * Only the SHA-256 hash of the token is persisted - the plain token is delivered
 * to the user via email and never stored. Records are soft-invalidated (via `usedAt`)
 * rather than deleted so that an audit trail of reset attempts is preserved.
 */
export interface PasswordResetToken {
    /** Unique record identifier (CUID). */
    id: string;

    /** The user this reset token was issued for. */
    userId: string;

    /**
     * SHA-256 hash of the plain reset token.
     * Only the hash is stored so a database leak cannot be used to reset passwords directly.
     */
    tokenHash: string;

    /** Absolute expiry timestamp; the token must be rejected after this point. */
    expiresAt: Date;

    /**
     * Timestamp set when the token is consumed by a successful password reset,
     * or when it is invalidated by a subsequent forgot-password request.
     * A non-null value means the token can no longer be used, even if it has not expired.
     */
    usedAt: Date | null;

    /** Timestamp when this reset token record was created. */
    createdAt: Date;
}