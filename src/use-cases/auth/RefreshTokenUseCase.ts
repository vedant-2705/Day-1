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

    async execute(rawToken: string, ctx: RequestContext): Promise<TokenPair> {
        // Hash the incoming token to look it up in DB
        // We never store the plain token - only its hash
        const tokenHash = HashService.hashToken(rawToken);

        // Find the token row - intentionally no filter on revokedAt/expiresAt
        // We need the raw row to detect reuse
        const storedToken =
            await this.refreshTokenRepo.findByTokenHash(tokenHash);

        // Token not found at all - invalid or tampered
        if (!storedToken) {
            throw new UnauthorizedError(ErrorKeys.INVALID_TOKEN);
        }

        // REUSE DETECTION - token was already revoked
        // This means either:
        //   a) Someone stole the token and is replaying it
        //   b) Client has a bug and is reusing old tokens
        // Either way - nuke ALL sessions for this user immediately
        if (storedToken.revokedAt !== null) {
            await this.refreshTokenRepo.revokeAllByUserId(storedToken.userId);
            throw new UnauthorizedError(ErrorKeys.TOKEN_REUSE_DETECTED);
        }

        // Token expired - normal flow, ask user to log in again
        if (storedToken.expiresAt < new Date()) {
            await this.refreshTokenRepo.revokeByTokenHash(tokenHash);
            throw new UnauthorizedError(ErrorKeys.INVALID_TOKEN);
        }

        // Fetch user - verify they still exist and are active
        const user = await this.userRepo.findById(storedToken.userId);
        if (!user) {
            // User was deleted after token was issued
            await this.refreshTokenRepo.revokeAllByUserId(storedToken.userId);
            throw new UnauthorizedError(ErrorKeys.INVALID_TOKEN);
        }

        // ROTATION - revoke the used token, issue a fresh one
        // Old token is now dead. Even if attacker has it, it's useless.
        await this.refreshTokenRepo.revokeByTokenHash(tokenHash);

        const newRawRefreshToken = HashService.generateToken();

        await this.refreshTokenRepo.create({
            userId: user.id,
            tokenHash: HashService.hashToken(newRawRefreshToken),
            deviceInfo: storedToken.deviceInfo, // preserve device info from original session
            ipAddress: ctx.ip, // update IP to current request
            expiresAt: this.jwtService.getRefreshTokenExpiry(),
        });

        // Sign fresh access token
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