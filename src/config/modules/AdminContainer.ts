/**
 * @module AdminContainer
 * @description Registers admin-specific dependencies into the tsyringe IoC container.
 * Covers use cases and controllers required for administration operations such as
 * promoting users to elevated roles.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { AdminController } from "controllers/admin/AdminController.js";
import {
    PROMOTE_USER_USE_CASE,
    PromoteUserUseCase,
} from "use-cases/admin/PromoteUserUseCase.js";

export function registerAdminContainer() {
    // --- Use Cases (Transient) ---
    // Transient: each resolution gets a fresh instance to avoid shared state between requests
    container.register(PROMOTE_USER_USE_CASE, { useClass: PromoteUserUseCase });

    // --- Controllers (Singleton) ---
    // Singleton: controllers are stateless and wired once at startup
    container.registerSingleton<AdminController>(AdminController);
}
