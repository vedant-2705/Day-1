/**
 * @module adminRoutes
 * @description Shared admin routes used by both v1 and v2 routers.
 * All routes here require:
 *   1. Valid access token (authMiddleware - applied globally in routes/index.ts)
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
 * @swagger
 * /v1/admin/users/{id}/promote:
 *   post:
 *     summary: Promote a USER to ADMIN
 *     description: |
 *       Elevates the target user's role from USER to ADMIN.
 *       Returns 409 if the user is already an ADMIN.
 *       **ADMIN only** - returns 403 for USER role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The CUID of the user to promote
 *         example: "clxyz123"
 *     responses:
 *       200:
 *         description: User promoted to ADMIN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: "clxyz123"
 *                 name: "Jane Doe"
 *                 email: "jane@example.com"
 *                 role: "ADMIN"
 *                 createdAt: "2024-01-15T10:00:00.000Z"
 *                 updatedAt: "2024-01-15T10:05:00.000Z"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: User is already an ADMIN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: "CONFLICT"
 *               detail: "User is already an ADMIN"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
    "/users/:id/promote",
    requireRole(UserRole.ADMIN),
    validate(uuidSchema, "params"),
    asyncHandler((req, res, next) => controller().promoteUser(req, res, next)),
);

export { router as adminRoutes };