/**
 * @module RegisterUseCase
 * @description Use case that registers a new user and immediately issues a token pair,
 * so the client is authenticated straight after sign-up without a separate login step.
 *
 * Steps performed:
 * 1. Fast-fail email uniqueness check (before expensive bcrypt hashing).
 * 2. Hash the plain-text password with bcrypt (cost 12).
 * 3. Persist the new user record (role defaults to `USER`).
 * 4. Sign a short-lived JWT access token.
 * 5. Generate and persist an opaque refresh token (hash-only storage).
 * 6. Return the safe {@link UserDTO}, access token, and raw refresh token.
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { USER_REPOSITORY, type IUserRepository } from "interfaces/repositories/IUserRepository.js";
import { HashService } from "lib/crypto/HashService.js";
import { JWT_SERVICE, JwtService } from "lib/jwt/JwtService.js";
import { REFRESH_TOKEN_REPOSITORY, type IRefreshTokenRepository } from "interfaces/repositories/IRefreshTokenRepository.js";
import { RegisterInput } from "validators/authValidator.js";
import { ConflictError } from "shared/errors/ConflictError.js";
import { AuthResult, RequestContext } from "types/auth/index.js";
import { UserRole } from "generated/prisma/enums.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

@injectable()
export class RegisterUseCase {
    constructor(
        @inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,

        @inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepo: IRefreshTokenRepository,

        @inject(JWT_SERVICE)
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Registers a new user and returns an {@link AuthResult} with a ready-to-use token pair.
     *
     * @param input - Validated registration payload (name, email, password).
     * @param ctx   - Request context (IP, User-Agent) for session tracking.
     * @returns {@link AuthResult} containing the safe user profile and both tokens.
     * @throws {ConflictError} If a user with the given email already exists.
     */
    async execute(
        input: RegisterInput,
        ctx: RequestContext,
    ): Promise<AuthResult> {
        // Fast-fail: check email availability before hashing (bcrypt is intentionally slow)
        const taken = await this.userRepository.existsByEmail(input.email);
        if (taken) {
            throw new ConflictError(ErrorKeys.USER_EMAIL_TAKEN, { email: input.email });
        }

        // Hash password - done AFTER the email check so we don't waste CPU on duplicates
        const passwordHash = await HashService.hashPassword(input.password);

        // Create user - mapper strips passwordHash, repository returns safe UserDTO
        const user = await this.userRepository.create({
            name: input.name,
            email: input.email,
            passwordHash,
            role: UserRole.USER, // every new account starts as USER
        });

        // Sign short-lived access token
        const accessToken = this.jwtService.signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Generate opaque refresh token and persist only its hash
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

export const REGISTER_USE_CASE = Symbol.for("RegisterUseCase");