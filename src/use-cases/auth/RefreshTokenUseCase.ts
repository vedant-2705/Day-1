/**
 * @module RefreshTokenUseCase
 * @description Use case that validates an incoming refresh token and rotates the token pair.
 *
 * Security guarantees enforced here:
 * - **Hash-only storage** - the raw token is hashed before DB lookup; the plain value is never persisted.
 * - **Reuse detection** - if a previously revoked token is presented, ALL sessions for that user
 *   are immediately invalidated. This limits the blast radius of a stolen token.
 * - **Rotation** - the used token is revoked and a brand-new token is issued on every successful
 *   refresh. An attacker who intercepts an old token cannot reuse it after one rotation.
 * - **Deleted-user guard** - if the user no longer exists, all their tokens are cleaned up.
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { USER_REPOSITORY, type IUserRepository } from "../../interfaces/repositories/IUserRepository.js";
import { REFRESH_TOKEN_REPOSITORY, type IRefreshTokenRepository } from "../../interfaces/repositories/IRefreshTokenRepository.js";
import { HashService } from "../../lib/crypto/HashService.js";
import { JWT_SERVICE, JwtService } from "../../lib/jwt/JwtService.js";
import { RequestContext, TokenPair } from "types/auth/index.js";
import { ErrorKeys } from "constants/ErrorCodes.js";
import { UnauthorizedError } from "shared/errors/UnauthorizedError.js";

@injectable()
export class RefreshTokenUseCase {
    constructor(
        @inject(USER_REPOSITORY)
        private readonly userRepo: IUserRepository,

        @inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepo: IRefreshTokenRepository,

        @inject(JWT_SERVICE)
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Validates the incoming refresh token and returns a rotated {@link TokenPair}.
     *
     * @param rawToken - The raw (unhashed) refresh token read from the HttpOnly cookie.
     * @param ctx      - Request context (IP, User-Agent) used to update session metadata.
     * @returns A new {@link TokenPair} with a fresh access token and rotated refresh token.
     * @throws {UnauthorizedError} If the token is not found, revoked, expired, or the user no longer exists.
     */
    async execute(rawToken: string, ctx: RequestContext): Promise<TokenPair> {
        // Hash the incoming token for DB lookup - the plain value is never stored
        const tokenHash = HashService.hashToken(rawToken);

        // Fetch without filtering revokedAt/expiresAt so we can detect reuse of revoked tokens
        const storedToken =
            await this.refreshTokenRepo.findByTokenHash(tokenHash);

        // Token not found - invalid or tampered
        if (!storedToken) {
            throw new UnauthorizedError(ErrorKeys.INVALID_TOKEN);
        }

        // REUSE DETECTION - token was already revoked
        // Indicates either a stolen token being replayed or a client bug.
        // Nuke ALL sessions for this user immediately to limit blast radius.
        if (storedToken.revokedAt !== null) {
            await this.refreshTokenRepo.revokeAllByUserId(storedToken.userId);
            throw new UnauthorizedError(ErrorKeys.TOKEN_REUSE_DETECTED);
        }

        // Token expired - normal expiry; ask user to log in again
        if (storedToken.expiresAt < new Date()) {
            await this.refreshTokenRepo.revokeByTokenHash(tokenHash);
            throw new UnauthorizedError(ErrorKeys.INVALID_TOKEN);
        }

        // Verify the user still exists (account may have been deleted after token was issued)
        const user = await this.userRepo.findById(storedToken.userId);
        if (!user) {
            await this.refreshTokenRepo.revokeAllByUserId(storedToken.userId);
            throw new UnauthorizedError(ErrorKeys.INVALID_TOKEN);
        }

        // ROTATION - revoke the used token and issue a fresh one
        // The old token is now dead; even if an attacker has it, it cannot be reused.
        await this.refreshTokenRepo.revokeByTokenHash(tokenHash);

        const newRawRefreshToken = HashService.generateToken();

        await this.refreshTokenRepo.create({
            userId: user.id,
            tokenHash: HashService.hashToken(newRawRefreshToken),
            deviceInfo: storedToken.deviceInfo, // preserve original device info
            ipAddress: ctx.ip,                  // update IP to current request
            expiresAt: this.jwtService.getRefreshTokenExpiry(),
        });

        // Sign a fresh short-lived access token
        const newAccessToken = this.jwtService.signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRawRefreshToken,
        };
    }
}

export const REFRESH_TOKEN_USE_CASE = Symbol.for("RefreshTokenUseCase");