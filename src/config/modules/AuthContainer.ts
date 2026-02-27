/**
 * @module AuthContainer
 * @description Registers authentication-specific dependencies into the tsyringe IoC container.
 * Covers the JWT service, all auth-related use cases (register, login, logout, token refresh,
 * and current-user lookup), and the AuthController.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { JWT_SERVICE, JwtService } from "lib/jwt/JwtService.js";
import { GET_ME_USE_CASE, GetMeUseCase } from "use-cases/auth/GetMeUseCase.js";
import { LOGOUT_ALL_USE_CASE, LogoutAllUseCase } from "use-cases/auth/LogOutAllUseCase.js";
import { LOGOUT_USE_CASE, LogoutUseCase } from "use-cases/auth/LogOutUseCase.js";
import { REFRESH_TOKEN_USE_CASE, RefreshTokenUseCase } from "use-cases/auth/RefreshTokenUseCase.js";
import { LOGIN_USE_CASE, LoginUseCase } from "use-cases/auth/LoginUseCase.js";
import { REGISTER_USE_CASE, RegisterUseCase } from "use-cases/auth/RegisterUseCase.js";
import { AuthController } from "controllers/auth/AuthController.js";

export function registerAuthContainer() {
    // --- Services (Singleton) ---
    // Singleton: JwtService wraps a stateless signing/verification utility; safe to share
    container.registerSingleton(JWT_SERVICE, JwtService);

    // --- Use Cases (Singleton) ---
    // Singleton: auth use cases hold no mutable per-request state and are safe to reuse
    container.registerSingleton(REGISTER_USE_CASE, RegisterUseCase);
    container.registerSingleton(LOGIN_USE_CASE, LoginUseCase);
    container.registerSingleton(REFRESH_TOKEN_USE_CASE, RefreshTokenUseCase);
    container.registerSingleton(LOGOUT_USE_CASE, LogoutUseCase);
    container.registerSingleton(LOGOUT_ALL_USE_CASE, LogoutAllUseCase);
    container.registerSingleton(GET_ME_USE_CASE, GetMeUseCase);

    // --- Controllers (Singleton) ---
    // Singleton: controllers are stateless and wired once at startup
    container.registerSingleton<AuthController>(AuthController);
}