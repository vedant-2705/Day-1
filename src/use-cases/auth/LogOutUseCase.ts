import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { REFRESH_TOKEN_REPOSITORY, type IRefreshTokenRepository } from "interfaces/repositories/IRefreshTokenRepository.js";
import { HashService } from "lib/crypto/HashService.js";

@injectable()
export class LogoutUseCase {
    constructor(
        @inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepo: IRefreshTokenRepository,
    ) {}

    /**
     * Revokes the single refresh token for the current device.
     * Other active sessions on other devices remain valid.
     *
     * No error is thrown if the token is not found or already revoked -
     * logout should always succeed from the client's perspective.
     * If the token is invalid, the client is effectively already logged out.
     */
    async execute(rawToken: string): Promise<void> {
        const tokenHash = HashService.hashToken(rawToken);
        await this.refreshTokenRepo.revokeByTokenHash(tokenHash);
    }
}

export const LOGOUT_USE_CASE = Symbol.for("LogoutUseCase");