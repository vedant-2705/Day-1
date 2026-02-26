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
     * Revokes ALL active refresh tokens for a user.
     * Forces re-login on every device.
     * Called when user requests "logout everywhere" or after a security event.
     *
     * userId comes from the verified JWT in AuthMiddleware — not from the
     * request body. Client cannot log out someone else by passing a different userId.
     */
    async execute(userId: string): Promise<void> {
        await this.refreshTokenRepo.revokeAllByUserId(userId);
    }
}

export const LOGOUT_ALL_USE_CASE = Symbol.for("LogoutAllUseCase");