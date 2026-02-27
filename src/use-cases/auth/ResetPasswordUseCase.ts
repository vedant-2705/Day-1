/**
 * @module ResetPasswordUseCase
 * @description Completes the password reset flow by consuming the one-time reset token
 * and updating the user's password.
 *
 * Security rules enforced:
 * 1. **Token existence** - token hash must exist in the database (tamper detection).
 * 2. **Expiry** - token must be within its 1-hour validity window.
 * 3. **One-time use** - token is marked as used before the password is written,
 *    preventing replay attacks via a race condition.
 * 4. **Full session revocation** - unlike `ChangePasswordUseCase`, all sessions including
 *    the current device are revoked, since a reset implies possible account compromise.
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import {
    USER_REPOSITORY,
    type IUserRepository,
} from "interfaces/repositories/IUserRepository.js";
import {
    REFRESH_TOKEN_REPOSITORY,
    type IRefreshTokenRepository,
} from "interfaces/repositories/IRefreshTokenRepository.js";
import {
    PASSWORD_RESET_TOKEN_REPOSITORY,
    type IPasswordResetTokenRepository,
} from "interfaces/repositories/IPasswordResetTokenRepository.js";
import { HashService } from "lib/crypto/HashService.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { BadRequestError } from "shared/errors/BadRequestError.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

export interface ResetPasswordInput {
    /** Plain token extracted from the reset link query parameter. */
    token: string;
    newPassword: string;
}

@injectable()
export class ResetPasswordUseCase {
    constructor(
        @inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,

        @inject(PASSWORD_RESET_TOKEN_REPOSITORY)
        private readonly resetTokenRepo: IPasswordResetTokenRepository,

        @inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepo: IRefreshTokenRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * Validates the reset token and updates the user's password.
     *
     * @param input - Plain reset token and the new password.
     * @throws {BadRequestError} If the token is not found, expired, or already used.
     *                            A single error code is used for all three cases to avoid
     *                            leaking which specific check failed.
     */
    async execute(input: ResetPasswordInput): Promise<void> {
        // Hash the incoming token for DB lookup - plain tokens are never stored
        const tokenHash = HashService.hashToken(input.token);

        const resetToken = await this.resetTokenRepo.findByTokenHash(tokenHash);

        if (!resetToken) {
            this.logger.warn("Password reset: token not found");
            throw new BadRequestError(ErrorKeys.INVALID_RESET_TOKEN);
        }

        if (resetToken.expiresAt < new Date()) {
            this.logger.warn(
                `Password reset: token expired for user ${resetToken.userId}`,
            );
            throw new BadRequestError(ErrorKeys.INVALID_RESET_TOKEN);
        }

        // Replay attack protection - each token is valid for exactly one use
        if (resetToken.usedAt !== null) {
            this.logger.warn(
                `Password reset: token already used for user ${resetToken.userId}`,
            );
            throw new BadRequestError(ErrorKeys.INVALID_RESET_TOKEN);
        }

        // Mark the token as used BEFORE writing the new password to prevent a race
        // condition where two simultaneous requests both pass the usedAt check
        await this.resetTokenRepo.markAsUsed(resetToken.id);

        const newPasswordHash = await HashService.hashPassword(input.newPassword);

        await this.userRepository.updatePassword(resetToken.userId, newPasswordHash);

        // Revoke ALL active sessions - a password reset implies possible account compromise,
        // so every device must re-authenticate (unlike change-password which keeps the current session)
        await this.refreshTokenRepo.revokeAllByUserId(resetToken.userId);

        this.logger.info(
            `Password reset successful for user ${resetToken.userId}. All sessions revoked.`,
        );
    }
}

export const RESET_PASSWORD_USE_CASE = Symbol.for("ResetPasswordUseCase");
