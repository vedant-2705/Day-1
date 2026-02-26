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
    // --- Services ---
    container.registerSingleton(JWT_SERVICE, JwtService);

    // --- Use Cases ---
    container.registerSingleton(REGISTER_USE_CASE, RegisterUseCase);
    container.registerSingleton(LOGIN_USE_CASE, LoginUseCase);
    container.registerSingleton(REFRESH_TOKEN_USE_CASE, RefreshTokenUseCase);
    container.registerSingleton(LOGOUT_USE_CASE, LogoutUseCase);
    container.registerSingleton(LOGOUT_ALL_USE_CASE, LogoutAllUseCase);
    container.registerSingleton(GET_ME_USE_CASE, GetMeUseCase);

    // --- Controllers ---
    container.registerSingleton<AuthController>(AuthController);
}