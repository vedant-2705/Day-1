import "reflect-metadata";
import { container } from "tsyringe";
import { RefreshTokenRepository } from "repositories/RefreshTokenRepository.js";
import { REFRESH_TOKEN_REPOSITORY } from "interfaces/repositories/IRefreshTokenRepository.js";

export function registerRefreshTokenContainer() {
    // --- Repositories & Mappers (Singletons) ---
    // Singleton: stateless data-access layer; safe to share across requests
    container.registerSingleton(REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository);

    // --- Use Cases (Transient) ---

    // --- Controllers (Singleton) ---
}