/**
 * @module routes/v1/reportRoutes
 * @description Defines the v1 report endpoints and wires them to the shared {@link ReportController}.
 * Report routes are shared across v1 and v2 because the response shape is identical;
 * only the mounting path differs.
 */

import { Router } from 'express';
import { asyncHandler } from 'middlewares/AsyncHandler.js';
import { resolveController } from 'helpers/ControllerResolver.js';
import { ReportController } from 'controllers/shared/ReportController.js';
import { requireRole } from 'middlewares/RoleMiddleware.js';
import { UserRole } from 'generated/prisma/enums.js';

const router = Router();

const controller = resolveController(ReportController);

/**
 * @swagger
 * /v1/reports/contacts-report:
 *   get:
 *     summary: Get aggregated contact statistics
 *     description: |
 *       Returns total contacts, contacts added today, and a breakdown of the most common email domains.
 *       **ADMIN only** - returns 403 for USER role.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 total: 142
 *                 addedToday: 5
 *                 mostCommonDomain: "gmail.com"
 *                 domainBreakdown:
 *                   - domain: "gmail.com"
 *                     count: 48
 *                     percentage: 33.8
 *                   - domain: "yahoo.com"
 *                     count: 22
 *                     percentage: 15.5
 *                 generatedAt: "2024-01-15T10:00:00.000Z"
 *               meta:
 *                 timestamp: "2024-01-15T10:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/contacts-report',
    requireRole(UserRole.ADMIN),
    asyncHandler((req, res, next) => controller().getContactReport(req, res, next)),
);

export { router as reportsRoutes };