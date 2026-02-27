/**
 * @module AuthController
 * @description Handles HTTP requests for all authentication endpoints:
 * registration, login, token refresh, logout (single device), logout-all (all devices),
 * and current-user lookup.
 *
 * Refresh tokens are issued as HttpOnly cookies scoped to `/api/auth` so they are
 * never accessible to JavaScript and are not sent on unrelated API requests.
 * Access tokens are returned in the JSON response body for the client to store
 * in memory.
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { REGISTER_USE_CASE, RegisterUseCase } from "use-cases/auth/RegisterUseCase.js";
import { LOGIN_USE_CASE, LoginUseCase } from "use-cases/auth/LoginUseCase.js";
import { REFRESH_TOKEN_USE_CASE, RefreshTokenUseCase } from "use-cases/auth/RefreshTokenUseCase.js";
import { GET_ME_USE_CASE, GetMeUseCase } from "use-cases/auth/GetMeUseCase.js";
import { JWT_SERVICE, JwtService } from "lib/jwt/JwtService.js";
import { successResponse } from "helpers/ResponseHelper.js";
import { registerSchema, loginSchema, ForgotPasswordInput } from "validators/authValidator.js";
import {
    getRefreshCookieOptions,
    getClearCookieOptions,
} from "lib/auth/cookieOptions.js";
import { UnauthorizedError } from "shared/errors/UnauthorizedError.js";
import { LOGOUT_USE_CASE, LogoutUseCase } from "use-cases/auth/LogOutUseCase.js";
import { LOGOUT_ALL_USE_CASE, LogoutAllUseCase } from "use-cases/auth/LogOutAllUseCase.js";
import { ErrorKeys } from "constants/ErrorCodes.js";
import { AuthenticatedRequest } from "middlewares/AuthMiddleware.js";
import { StatusCodes } from "http-status-codes";
import { RESET_PASSWORD_USE_CASE, ResetPasswordInput, ResetPasswordUseCase } from "use-cases/auth/ResetPasswordUseCase.js";
import { FORGOT_PASSWORD_USE_CASE, ForgotPasswordUseCase } from "use-cases/auth/ForgotPasswordUseCase.js";
import { CHANGE_PASSWORD_USE_CASE, ChangePasswordInput, ChangePasswordUseCase } from "use-cases/auth/ChangePasswordUseCase.js";
import { HashService } from "lib/crypto/HashService.js";

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

        @inject(CHANGE_PASSWORD_USE_CASE)
        private readonly changePasswordUseCase: ChangePasswordUseCase,

        @inject(FORGOT_PASSWORD_USE_CASE)
        private readonly forgotPasswordUseCase: ForgotPasswordUseCase,

        @inject(RESET_PASSWORD_USE_CASE)
        private readonly resetPasswordUseCase: ResetPasswordUseCase,

        @inject(JWT_SERVICE) 
        private readonly jwtService: JwtService,
    ) {}

    /**
     * POST /api/auth/register
     *
     * Registers a new user, issues an access token and sets the refresh token cookie.
     * @responds 201 - Created. Returns `{ user, accessToken }`.
     */
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

        res.status(StatusCodes.CREATED).json(
            successResponse(
                { user, accessToken },
            ),
        );
    }

    /**
     * POST /api/auth/login
     *
     * Authenticates a user with email and password, issues an access token and sets the refresh token cookie.
     * @responds 200 - OK. Returns `{ user, accessToken }`.
     */
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

        res.status(StatusCodes.OK).json(
            successResponse({ user, accessToken }),
        );
    }

    /**
     * POST /api/auth/refresh
     *
     * Rotates the refresh token cookie and issues a new access token.
     * Reads the refresh token exclusively from the HttpOnly cookie - body values are ignored.
     * @responds 200 - OK. Returns `{ accessToken }`.
     */
    async refresh(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        // Read refresh token from HttpOnly cookie - not from body
        // If client sends it in body, ignore it (could be XSS-extracted)
        const rawToken = req.cookies?.[this.jwtService.getCookieName()] as
            | string
            | undefined;

        if (!rawToken) {
            throw new UnauthorizedError(ErrorKeys.INVALID_TOKEN);
        }

        const ctx = this.extractRequestContext(req);

        const { accessToken, refreshToken } =
            await this.refreshTokenUseCase.execute(rawToken, ctx);

        // Rotate cookie - old cookie replaced with new token
        this.setRefreshCookie(res, refreshToken);

        res.status(StatusCodes.OK).json(
            successResponse({ accessToken }),
        );
    }

    /**
     * POST /api/auth/logout
     *
     * Revokes the current device's refresh token and clears the cookie.
     * Always returns 200 - even if the cookie was already absent - so the client
     * can treat logout as idempotent.
     * @responds 200 - OK.
     */
    async logout(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const rawToken = req.cookies?.[this.jwtService.getCookieName()] as
            | string
            | undefined;

        // If no cookie present, client is already logged out - still return 200
        // Logout must always succeed from the client's perspective
        if (rawToken) {
            await this.logoutUseCase.execute(rawToken);
        }

        this.clearRefreshCookie(res);

        res.status(StatusCodes.OK).json(successResponse(null));
    }

    /**
     * POST /api/auth/logout-all
     *
     * Revokes all active refresh tokens for the authenticated user, logging out every device.
     * Requires `authMiddleware` to run first - `userId` is read from the verified JWT payload.
     * @responds 200 - OK.
     */
    async logoutAll(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        // userId from verified JWT - AuthMiddleware must run before this
        // User cannot pass a different userId to log out someone else
        const authReq = req as AuthenticatedRequest;

        await this.logoutAllUseCase.execute(authReq.user.userId);

        this.clearRefreshCookie(res);

        res.status(StatusCodes.OK).json(
            successResponse(null),
        );
    }

    /**
     * GET /api/auth/me
     *
     * Returns the profile of the currently authenticated user.
     * Requires `authMiddleware` - `userId` is read from the verified JWT payload.
     * @responds 200 - OK. Returns `{ user }`.
     */
    async me(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as AuthenticatedRequest;

        const user = await this.getMeUseCase.execute(authReq.user.userId);

        res.status(StatusCodes.OK).json(successResponse({ user }));
    }

    /**
     * POST /api/auth/change-password
     *
     * Changes the authenticated user's password.
     * Revokes all other active refresh token sessions except the current one,
     * so the user stays logged in on this device while all other devices are signed out.
     * Requires `authMiddleware` - `userId` is read from the verified JWT payload.
     * @responds 200 - OK.
     */
    async changePassword(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const authReq = req as AuthenticatedRequest;
        const input = req.body as ChangePasswordInput;

        // Extract current refresh token hash so we can keep this session alive
        // and revoke all others
        const rawRefreshToken = req.cookies?.[this.jwtService.getCookieName()] as
            | string
            | undefined;

        // Hash the current refresh token to identify the current session
        const currentTokenHash = rawRefreshToken
            ? HashService.hashToken(rawRefreshToken)
            : '';

        await this.changePasswordUseCase.execute(
            authReq.user.userId,
            currentTokenHash,
            {
                currentPassword: input.currentPassword,
                newPassword: input.newPassword,
            },
        );

        res.status(StatusCodes.OK).json(
            successResponse({
                message: "Password changed successfully. Other sessions have been logged out.",
            }),
        );
    }

    /**
     * POST /api/auth/forgot-password
     *
     * Initiates the password reset flow by generating a time-limited reset token
     * and (in production) sending it to the user's registered email address.
     * In non-production environments the reset link is included in the response
     * body for easier testing with Postman.
     * Public route - no authentication required.
     * @responds 200 - OK. Returns `{ message }` (and `resetLink` in non-production).
     */
    async forgotPassword(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const { email } = req.body as ForgotPasswordInput;

        const result = await this.forgotPasswordUseCase.execute(email);

        // In production the reset link is sent via email, not returned in the response
        // In development it is included so the flow can be tested without an email server
        res.status(StatusCodes.OK).json(
            successResponse({
                message: result.message,
                ...(process.env['NODE_ENV'] !== 'production' && {
                    resetLink: result.resetLink,
                }),
            }),
        );
    }

    /**
     * POST /api/auth/reset-password
     *
     * Completes the password reset flow using the token issued by `forgotPassword`.
     * The token in the request body acts as the credential - no `Authorization` header
     * is required. On success, all active refresh token sessions are revoked and the
     * refresh cookie is cleared, requiring the user to log in again with the new password.
     * Public route - the reset token itself provides the necessary authorisation.
     * @responds 200 - OK.
     */
    async resetPassword(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const input = req.body as ResetPasswordInput;

        await this.resetPasswordUseCase.execute({
            token: input.token,
            newPassword: input.newPassword,
        });

        // Clear refresh cookie - all sessions revoked, cookie is now useless
        this.clearRefreshCookie(res);

        res.status(StatusCodes.OK).json(
            successResponse({
                message: "Password reset successful. Please log in with your new password.",
            }),
        );
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
     * Must use the same path/domain options as when it was set - otherwise
     * the browser won't find the cookie to clear it.
     */
    private clearRefreshCookie(res: Response): void {
        res.clearCookie(
            this.jwtService.getCookieName(),
            getClearCookieOptions(),
        );
    }
}
