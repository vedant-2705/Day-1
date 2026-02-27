/**
 * @module RefreshTokenContainer
 * @description Registers refresh-token-domain dependencies into the tsyringe IoC container.
 * Currently covers the refresh token repository. Use case and controller registrations
 * are reserved here for future expansion.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { RefreshTokenRepository } from "repositories/RefreshTokenRepository.js";
import { REFRESH_TOKEN_REPOSITORY } from "interfaces/repositories/IRefreshTokenRepository.js";

export function registerRefreshTokenContainer() {
    // --- Repositories (Singleton) ---
    // Singleton: stateless data-access layer; safe to share across requests
    container.registerSingleton(REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository);

    // --- Use Cases (Transient) ---
    // Reserved for future refresh-token use cases

    // --- Controllers (Singleton) ---
    // Reserved for future refresh-token controllers
}