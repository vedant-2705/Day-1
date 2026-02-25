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

const router = Router();

const controller = resolveController(ReportController);

/**
 * GET /v1/reports/contacts-report
 * Returns aggregated contact statistics (total, added today, top email domains).
 * Response is cached for 60 seconds to reduce database load on repeated calls.
 */
router.get(
    '/contacts-report',
    asyncHandler((req, res, next) => controller().getContactReport(req, res, next)),
);

export { router as reportsRoutes };