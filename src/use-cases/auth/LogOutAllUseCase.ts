/**
 * @module LogoutAllUseCase
 * @description Use case that revokes every active refresh token belonging to a user,
 * effectively logging them out on all devices simultaneously.
 *
 * Typical triggers:
 * - User clicks "Log out everywhere" in account settings.
 * - A security event (e.g. password change, suspicious login) requires immediate
 *   session invalidation across all devices.
 *
 * The `userId` is always sourced from the verified JWT payload attached by
 * `authMiddleware` - a client cannot log out a different user by supplying a
 * different ID in the request body.
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { type IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from "interfaces/repositories/IRefreshTokenRepository.js";

@injectable()
export class LogoutAllUseCase {
    constructor(
        @inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepo: IRefreshTokenRepository,
    ) {}

    /**
     * Revokes all active refresh tokens for the given user.
     *
     * @param userId - ID of the user extracted from the verified JWT; never from the request body.
     */
    async execute(userId: string): Promise<void> {
        await this.refreshTokenRepo.revokeAllByUserId(userId);
    }
}

export const LOGOUT_ALL_USE_CASE = Symbol.for("LogoutAllUseCase");