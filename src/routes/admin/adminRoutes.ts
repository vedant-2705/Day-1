/**
 * @module adminRoutes
 * @description Shared admin routes used by both v1 and v2 routers.
 * All routes here require:
 *   1. Valid access token (authMiddleware — applied globally in routes/index.ts)
 *   2. ADMIN role (requireRole applied here per route)
 *
 * Route table:
 *   POST /admin/users/:id/promote  - Promote a USER to ADMIN
 */

import { Router } from "express";
import { asyncHandler } from "middlewares/AsyncHandler.js";
import { validate } from "middlewares/ValidationMiddleware.js";
import { requireRole } from "middlewares/RoleMiddleware.js";
import { UserRole } from "generated/prisma/enums.js";
import { resolveController } from "helpers/ControllerResolver.js";
import { AdminController } from "controllers/admin/AdminController.js";
import { uuidSchema } from "validators/contactValidator.js";

const router = Router();

const controller = resolveController(AdminController);

/**
 * POST /admin/users/:id/promote
 * Promotes the target user from USER → ADMIN.
 * Requires: authenticated + ADMIN role
 */
router.post(
    "/users/:id/promote",
    requireRole(UserRole.ADMIN),
    validate(uuidSchema, "params"),
    asyncHandler((req, res, next) => controller().promoteUser(req, res, next)),
);

export { router as adminRoutes };
