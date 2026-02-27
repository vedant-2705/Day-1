/**
 * @module IPasswordResetTokenRepository
 * @description Defines the persistence contract for password reset token management.
 *
 * Tokens are stored as SHA-256 hashes - the plain token is never persisted.
 * Used and expired tokens are soft-invalidated (not deleted) to maintain an
 * audit trail of reset attempts per user.
 */

import { PasswordResetToken } from "domain/entities/PasswordResetToken.js";

export interface IPasswordResetTokenRepository {
    /**
     * Persists a new password reset token record.
     * {@link ForgotPasswordUseCase} calls {@link invalidateAllForUser} before
     * this to ensure only one active token exists per user at a time.
     *
     * @param data Token data including the SHA-256 hash, owning user ID, and expiry.
     * @returns The newly created {@link PasswordResetToken} record.
     */
    create(data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<PasswordResetToken>;

    /**
     * Finds a reset token by its SHA-256 hash.
     *
     * Does NOT filter by `usedAt` or `expiresAt` - the calling use case is
     * responsible for checking those fields so it can respond appropriately
     * to expired vs already-used tokens.
     *
     * @param hash SHA-256 hash of the plain token from the reset link.
     * @returns The matching {@link PasswordResetToken}, or `null` if not found.
     */
    findByTokenHash(hash: string): Promise<PasswordResetToken | null>;

    /**
     * Marks a token as consumed by setting `usedAt` to the current timestamp.
     * Must be called before writing the new password to prevent a race condition
     * where two simultaneous requests both pass the `usedAt` check.
     *
     * @param id The ID of the token record to mark as used.
     */
    markAsUsed(id: string): Promise<void>;

    /**
     * Soft-invalidates all currently unused reset tokens for a user by setting `usedAt`.
     * Called before issuing a new token to ensure only one is active per user at a time.
     * Tokens are not deleted so the audit trail of reset attempts is preserved.
     *
     * @param userId The ID of the user whose pending tokens should be invalidated.
     */
    invalidateAllForUser(userId: string): Promise<void>;

    /**
     * Hard-deletes all tokens whose `expiresAt` is in the past.
     * Intended to be called by a scheduled cleanup job to keep the table lean.
     *
     * @returns The number of records deleted.
     */
    deleteExpired(): Promise<number>;
}

/** DI token used to resolve {@link IPasswordResetTokenRepository} from the tsyringe container. */
export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol.for(
    "IPasswordResetTokenRepository",
);
