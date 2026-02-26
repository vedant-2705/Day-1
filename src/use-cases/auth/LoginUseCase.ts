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
import { ERROR_CODES } from "constants/ErrorCodes.js";
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

    async execute(input: LoginInput, ctx: RequestContext): Promise<AuthResult> {
        // Fetch raw user - we need passwordHash to verify
        // findRawByEmail is the only method that returns it
        const raw = await this.userRepo.findRawByEmail(input.email);

        if (!raw) {
            throw new UnauthorizedError(ERROR_CODES.INVALID_CREDENTIALS.code);
        }

        // Verify password - bcrypt.compare is constant-time
        const valid = await HashService.comparePassword(
            input.password,
            raw.passwordHash,
        );
        if (!valid) {
            throw new UnauthorizedError(ERROR_CODES.INVALID_CREDENTIALS.code);
        }

        // Map to safe DTO - passwordHash never leaves this use case
        const user = this.userMapper.toDTO(raw);

        // Sign access token
        const accessToken = this.jwtService.signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Generate and store refresh token
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