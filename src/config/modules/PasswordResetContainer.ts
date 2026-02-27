import "reflect-metadata";
import { container } from "tsyringe";
import { PasswordResetTokenRepository } from "repositories/PasswordResetTokenRepository.js";
import { PASSWORD_RESET_TOKEN_REPOSITORY } from "interfaces/repositories/IPasswordResetTokenRepository.js";
import {
    CHANGE_PASSWORD_USE_CASE,
    ChangePasswordUseCase,
} from "use-cases/auth/ChangePasswordUseCase.js";
import {
    FORGOT_PASSWORD_USE_CASE,
    ForgotPasswordUseCase,
} from "use-cases/auth/ForgotPasswordUseCase.js";
import {
    RESET_PASSWORD_USE_CASE,
    ResetPasswordUseCase,
} from "use-cases/auth/ResetPasswordUseCase.js";

export function registerPasswordResetContainer() {
    // Repository
    container.registerSingleton(
        PASSWORD_RESET_TOKEN_REPOSITORY,
        PasswordResetTokenRepository,
    );

    // Use Cases
    container.registerSingleton(
        CHANGE_PASSWORD_USE_CASE,
        ChangePasswordUseCase,
    );
    container.registerSingleton(
        FORGOT_PASSWORD_USE_CASE,
        ForgotPasswordUseCase,
    );
    container.registerSingleton(RESET_PASSWORD_USE_CASE, ResetPasswordUseCase);
}

