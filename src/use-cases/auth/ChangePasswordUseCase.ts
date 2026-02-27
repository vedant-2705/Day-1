/**
 * @module ChangePasswordUseCase
 * @description Allows an authenticated user to change their own password.
 *
 * Security rules enforced:
 * 1. **Current password verification** - the caller must prove they know the existing password
 *    before a change is accepted, protecting against silent takeover on an unattended device.
 * 2. **Same-password guard** - the new password must differ from the current one.
 * 3. **Selective session revocation** - all sessions *except* the current device are revoked,
 *    so the user remains logged in locally while all other devices are forced to re-authenticate.
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
import { HashService } from "lib/crypto/HashService.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { UnauthorizedError } from "shared/errors/UnauthorizedError.js";
import { BadRequestError } from "shared/errors/BadRequestError.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

@injectable()
export class ChangePasswordUseCase {
    constructor(
        @inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,

        @inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepo: IRefreshTokenRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * Changes the password for the authenticated user.
     *
     * @param userId           - ID from the verified JWT; never trust a client-supplied value.
     * @param currentTokenHash - SHA-256 hash of the caller's current refresh token.
     *                           Used to exempt the current session from revocation.
     * @param input            - Current and new passwords.
     * @throws {NotFoundError}     If the user no longer exists.
     * @throws {UnauthorizedError} If `currentPassword` does not match the stored hash.
     * @throws {BadRequestError}   If `newPassword` is identical to the current password.
     */
    async execute(
        userId: string,
        currentTokenHash: string,
        input: ChangePasswordInput,
    ): Promise<void> {
        this.logger.info(`Password change requested for user ${userId}`);

        // findRawByEmail is the only repository method that returns passwordHash
        const raw = await this.userRepository.findRawByEmail(
            await this.getEmailForUser(userId),
        );

        if (!raw) {
            throw new NotFoundError(ErrorKeys.USER_NOT_FOUND, { id: userId });
        }

        // Verify current password - proves the requester is the account owner,
        // not just someone who obtained a valid access token
        const currentPasswordValid = await HashService.comparePassword(
            input.currentPassword,
            raw.passwordHash,
        );

        if (!currentPasswordValid) {
            this.logger.warn(
                `Password change failed: wrong current password for user ${userId}`,
            );
            throw new UnauthorizedError(ErrorKeys.INVALID_CREDENTIALS);
        }

        // Reject if the new password is identical to the current one
        const samePassword = await HashService.comparePassword(
            input.newPassword,
            raw.passwordHash,
        );

        if (samePassword) {
            throw new BadRequestError(ErrorKeys.SAME_PASSWORD);
        }

        const newPasswordHash = await HashService.hashPassword(input.newPassword);

        await this.userRepository.updatePassword(userId, newPasswordHash);

        // Revoke all sessions except the current device so the user stays logged in here
        await this.refreshTokenRepo.revokeAllExcept(userId, currentTokenHash);

        this.logger.info(
            `Password changed successfully for user ${userId}. Other sessions revoked.`,
        );
    }

    /**
     * Resolves a user's email address from their ID.
     * Required because `findRawByEmail` is the only method that returns `passwordHash`,
     * but the JWT only carries `userId`.
     *
     * @param userId - The user's ID.
     * @returns The user's email address.
     * @throws {NotFoundError} If no user with the given ID exists.
     */
    private async getEmailForUser(userId: string): Promise<string> {
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new NotFoundError(ErrorKeys.USER_NOT_FOUND, { id: userId });
        return user.email;
    }
}

export const CHANGE_PASSWORD_USE_CASE = Symbol.for("ChangePasswordUseCase");
