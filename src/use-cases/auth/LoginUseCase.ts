/**
 * @module LoginUseCase
 * @description Use case that authenticates a user with email and password,
 * then issues a JWT access token and a persisted opaque refresh token.
 *
 * This is the only use case that calls `findRawByEmail` - the sole repository
 * method that returns `passwordHash`. The hash never leaves this use case;
 * all return values use the safe {@link UserDTO} (via the mapper).
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { type IUserRepository, USER_REPOSITORY } from "interfaces/repositories/IUserRepository.js";
import { type IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from "interfaces/repositories/IRefreshTokenRepository.js";
import { HashService } from "lib/crypto/HashService.js";
import { JWT_SERVICE, JwtService } from "lib/jwt/JwtService.js";
import { LoginInput } from "validators/authValidator.js";
import { USER_MAPPER } from "interfaces/mapper/IUserMapper.js";
import { UserMapper } from "mapper/UserMapper.js";
import { AuthResult, RequestContext } from "types/auth/index.js";
import { ErrorKeys } from "constants/ErrorCodes.js";
import { UnauthorizedError } from "shared/errors/UnauthorizedError.js";

@injectable()
export class LoginUseCase {
    constructor(
        @inject(USER_REPOSITORY)
        private readonly userRepo: IUserRepository,

        @inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepo: IRefreshTokenRepository,

        @inject(JWT_SERVICE)
        private readonly jwtService: JwtService,

        @inject(USER_MAPPER)
        private readonly userMapper: UserMapper,
    ) {}

    /**
     * Verifies credentials and issues a token pair on success.
     *
     * @param input - Validated login payload (email + password).
     * @param ctx   - Request context (IP, User-Agent) for session tracking.
     * @returns {@link AuthResult} containing the safe user profile and both tokens.
     * @throws {UnauthorizedError} If the email is not found or the password does not match.
     */
    async execute(input: LoginInput, ctx: RequestContext): Promise<AuthResult> {
        // findRawByEmail is the only method that returns passwordHash
        const raw = await this.userRepo.findRawByEmail(input.email);

        if (!raw) {
            throw new UnauthorizedError(ErrorKeys.INVALID_CREDENTIALS);
        }

        // bcrypt.compare is constant-time - safe against timing attacks
        const valid = await HashService.comparePassword(
            input.password,
            raw.passwordHash,
        );
        if (!valid) {
            throw new UnauthorizedError(ErrorKeys.INVALID_CREDENTIALS);
        }

        // Map to safe DTO - passwordHash never leaves this use case
        const user = this.userMapper.toDTO(raw);

        // Sign short-lived access token
        const accessToken = this.jwtService.signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Generate opaque refresh token, persist only its hash
        const rawRefreshToken = HashService.generateToken();

        await this.refreshTokenRepo.create({
            userId: user.id,
            tokenHash: HashService.hashToken(rawRefreshToken),
            deviceInfo: ctx.userAgent,
            ipAddress: ctx.ip,
            expiresAt: this.jwtService.getRefreshTokenExpiry(),
        });

        return { user, accessToken, refreshToken: rawRefreshToken };
    }
}

export const LOGIN_USE_CASE = Symbol.for("LoginUseCase");