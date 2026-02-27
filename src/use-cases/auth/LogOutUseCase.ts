/**
 * @module LogoutUseCase
 * @description Use case that revokes the refresh token for the current device,
 * logging the user out of this session only. Other active sessions on other
 * devices remain valid.
 *
 * This use case is intentionally lenient: if the token is not found or has already
 * been revoked, no error is raised. From the client's perspective logout must always
 * succeed - if the token is invalid, the session is effectively already ended.
 */
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
     * Revokes the refresh token associated with the current device session.
     *
     * @param rawToken - The raw (unhashed) refresh token read from the HttpOnly cookie.
     */
    async execute(rawToken: string): Promise<void> {
        const tokenHash = HashService.hashToken(rawToken);
        await this.refreshTokenRepo.revokeByTokenHash(tokenHash);
    }
}

export const LOGOUT_USE_CASE = Symbol.for("LogoutUseCase");