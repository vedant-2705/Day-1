import "reflect-metadata";
import { container } from "tsyringe";
import { AdminController } from "controllers/admin/AdminController.js";
import {
    PROMOTE_USER_USE_CASE,
    PromoteUserUseCase,
} from "use-cases/admin/PromoteUserUseCase.js";

export function registerAdminContainer() {
    // --- Use Cases ---
    container.register(PROMOTE_USER_USE_CASE, { useClass: PromoteUserUseCase });

    // --- Controllers ---
    container.registerSingleton<AdminController>(AdminController);
}
