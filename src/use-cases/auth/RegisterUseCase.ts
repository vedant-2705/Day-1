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

    async execute(
        input: RegisterInput,
        ctx: RequestContext,
    ): Promise<AuthResult> {
        // Check email availability before hashing (fast fail)
        const taken = await this.userRepository.existsByEmail(input.email);
        if (taken) {
            throw new ConflictError(ErrorKeys.USER_EMAIL_TAKEN, { email: input.email });
        }

        // Hash password - bcrypt with cost 12
        // Done AFTER the email check so we don't waste CPU on duplicates
        const passwordHash = await HashService.hashPassword(input.password);

        // Create user - mapper strips passwordHash, returns safe UserDTO
        const user = await this.userRepository.create({
            name: input.name,
            email: input.email,
            passwordHash,
            role: UserRole.USER, // default to USER 
        });

        // Issue token pair - same flow as login
        const accessToken = this.jwtService.signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const rawRefreshToken = HashService.generateToken();

        // Persist hashed refresh token
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