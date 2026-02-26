import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { REGISTER_USE_CASE, RegisterUseCase } from "use-cases/auth/RegisterUseCase.js";
import { LOGIN_USE_CASE, LoginUseCase } from "use-cases/auth/LoginUseCase.js";
import { REFRESH_TOKEN_USE_CASE, RefreshTokenUseCase } from "use-cases/auth/RefreshTokenUseCase.js";
import { GET_ME_USE_CASE, GetMeUseCase } from "use-cases/auth/GetMeUseCase.js";
import { JWT_SERVICE, JwtService } from "lib/jwt/JwtService.js";
import { successResponse } from "helpers/ResponseHelper.js";
import { registerSchema, loginSchema } from "validators/authValidator.js";
import {
    getRefreshCookieOptions,
    getClearCookieOptions,
} from "lib/auth/cookieOptions.js";
import { UnauthorizedError } from "shared/errors/UnauthorizedError.js";
import { LOGOUT_USE_CASE, LogoutUseCase } from "use-cases/auth/LogOutUseCase.js";
import { LOGOUT_ALL_USE_CASE, LogoutAllUseCase } from "use-cases/auth/LogOutAllUseCase.js";
import { ERROR_CODES } from "constants/ErrorCodes.js";
import { AuthenticatedRequest } from "middlewares/AuthMiddleware.js";

@injectable()
export class AuthController {
    constructor(
        @inject(REGISTER_USE_CASE)
        private readonly registerUseCase: RegisterUseCase,

        @inject(LOGIN_USE_CASE) 
        private readonly loginUseCase: LoginUseCase,

        @inject(REFRESH_TOKEN_USE_CASE)
        private readonly refreshTokenUseCase: RefreshTokenUseCase,

        @inject(LOGOUT_USE_CASE) 
        private readonly logoutUseCase: LogoutUseCase,

        @inject(LOGOUT_ALL_USE_CASE)
        private readonly logoutAllUseCase: LogoutAllUseCase,

        @inject(GET_ME_USE_CASE) 
        private readonly getMeUseCase: GetMeUseCase,

        @inject(JWT_SERVICE) 
        private readonly jwtService: JwtService,
    ) {}

    // POST /api/auth/register 

    async register(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const input = req.body as ReturnType<typeof registerSchema.parse>;

        const ctx = this.extractRequestContext(req);

        const { user, accessToken, refreshToken } =
            await this.registerUseCase.execute(input, ctx);

        this.setRefreshCookie(res, refreshToken);

        res.status(201).json(
            successResponse(
                { user, accessToken },
                "Account created successfully",
            ),
        );
    }

    // POST /api/auth/login

    async login(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const input = req.body as ReturnType<typeof loginSchema.parse>;

        const ctx = this.extractRequestContext(req);

        const { user, accessToken, refreshToken } =
            await this.loginUseCase.execute(input, ctx);

        this.setRefreshCookie(res, refreshToken);

        res.status(200).json(
            successResponse({ user, accessToken }, "Logged in successfully"),
        );
    }

    // POST /api/auth/refresh 

    async refresh(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        // Read refresh token from HttpOnly cookie — not from body
        // If client sends it in body, ignore it (could be XSS-extracted)
        const rawToken = req.cookies?.[this.jwtService.getCookieName()] as
            | string
            | undefined;

        if (!rawToken) {
            throw new UnauthorizedError(ERROR_CODES.INVALID_TOKEN.code);
        }

        const ctx = this.extractRequestContext(req);

        const { accessToken, refreshToken } =
            await this.refreshTokenUseCase.execute(rawToken, ctx);

        // Rotate cookie — old cookie replaced with new token
        this.setRefreshCookie(res, refreshToken);

        res.status(200).json(
            successResponse({ accessToken }, "Token refreshed successfully"),
        );
    }

    // POST /api/auth/logout

    async logout(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const rawToken = req.cookies?.[this.jwtService.getCookieName()] as
            | string
            | undefined;

        // If no cookie present, client is already logged out — still return 200
        // Logout must always succeed from the client's perspective
        if (rawToken) {
            await this.logoutUseCase.execute(rawToken);
        }

        this.clearRefreshCookie(res);

        res.status(200).json(successResponse(null, "Logged out successfully"));
    }

    // POST /api/auth/logout-all

    async logoutAll(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        // userId from verified JWT — AuthMiddleware must run before this
        // User cannot pass a different userId to log out someone else
        const authReq = req as AuthenticatedRequest;

        await this.logoutAllUseCase.execute(authReq.user.userId);

        this.clearRefreshCookie(res);

        res.status(200).json(
            successResponse(null, "Logged out from all devices successfully"),
        );
    }

    // GET /api/auth/me─

    async me(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthenticatedRequest;

        const user = await this.getMeUseCase.execute(authReq.user.userId);

        res.status(200).json(successResponse({ user }));
    }

    // Private helpers

    /**
     * Extracts IP and User-Agent from the request for audit/session tracking.
     * X-Forwarded-For is set by proxies and load balancers in production.
     */
    private extractRequestContext(req: Request) {
        return {
            ip:
                (req.headers["x-forwarded-for"] as string) ??
                req.socket.remoteAddress ??
                null,
            userAgent: req.headers["user-agent"] ?? null,
        };
    }

    /**
     * Sets the refresh token as an HttpOnly cookie.
     * Cookie is scoped to /api/auth so it is not sent on every API request.
     */
    private setRefreshCookie(res: Response, rawToken: string): void {
        const expiresAt = this.jwtService.getRefreshTokenExpiry();
        res.cookie(
            this.jwtService.getCookieName(),
            rawToken,
            getRefreshCookieOptions(expiresAt),
        );
    }

    /**
     * Clears the refresh token cookie on logout.
     * Must use the same path/domain options as when it was set — otherwise
     * the browser won't find the cookie to clear it.
     */
    private clearRefreshCookie(res: Response): void {
        res.clearCookie(
            this.jwtService.getCookieName(),
            getClearCookieOptions(),
        );
    }
}
