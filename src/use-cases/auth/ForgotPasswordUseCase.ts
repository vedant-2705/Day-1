/**
 * @module ForgotPasswordUseCase
 * @description Initiates the password reset flow by generating a one-time reset token.
 *
 * Security rules enforced:
 * 1. **Anti-enumeration** - always returns the same message regardless of whether the email exists.
 * 2. **Token rotation** - all previous unused reset tokens for the user are invalidated before
 *    a new one is issued, ensuring only one active token exists at a time.
 * 3. **Short expiry** - token expires in 1 hour (configurable via `config.resetTokenExpiryMs`).
 * 4. **Hash-only storage** - only the SHA-256 hash of the token is persisted; the plain token
 *    is returned for delivery via email (or in the response body during development).
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import {
    USER_REPOSITORY,
    type IUserRepository,
} from "interfaces/repositories/IUserRepository.js";
import {
    PASSWORD_RESET_TOKEN_REPOSITORY,
    type IPasswordResetTokenRepository,
} from "interfaces/repositories/IPasswordResetTokenRepository.js";
import { HashService } from "lib/crypto/HashService.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { config } from "config/env.js";

export interface ForgotPasswordResult {
    /**
     * The full reset URL containing the plain token.
     * In production this is sent via email and never included in the API response.
     * In non-production environments it is returned in the response body for testing.
     */
    resetLink: string;

    /**
     * Generic confirmation message - identical whether or not the email is registered.
     * Never reveal to the client whether the email exists in the system.
     */
    message: string;
}

@injectable()
export class ForgotPasswordUseCase {
    constructor(
        @inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,

        @inject(PASSWORD_RESET_TOKEN_REPOSITORY)
        private readonly resetTokenRepo: IPasswordResetTokenRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * Generates a password reset token for the given email address.
     *
     * @param email - The email address submitted by the user.
     * @returns {@link ForgotPasswordResult} with a generic message (and reset link in non-production).
     */
    async execute(email: string): Promise<ForgotPasswordResult> {
        const genericMessage =
            "If this email is registered, you will receive a password reset link shortly";

        const normalised = email.toLowerCase().trim();

        const user = await this.userRepository.findByEmail(normalised);

        if (!user) {
            this.logger.info(
                `Forgot password: email ${normalised} not found - returning generic response`,
            );
            // Return a syntactically valid but non-functional link so the response
            // shape is identical to a successful case - prevents timing-based enumeration
            return {
                resetLink: `${config.appUrl}/reset-password?token=invalid`,
                message: genericMessage,
            };
        }

        // Invalidate any previous unused tokens to ensure only one is active at a time
        await this.resetTokenRepo.invalidateAllForUser(user.id);

        const rawToken = HashService.generateToken();
        const tokenHash = HashService.hashToken(rawToken);

        await this.resetTokenRepo.create({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + config.resetTokenExpiryMs),
        });

        const resetLink = `${config.appUrl}/reset-password?token=${rawToken}`;

        this.logger.info(`Password reset token generated for user ${user.id}`);

        return {
            resetLink,
            message: genericMessage,
        };
    }
}

export const FORGOT_PASSWORD_USE_CASE = Symbol.for("ForgotPasswordUseCase");
