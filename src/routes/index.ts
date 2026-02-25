/**
 * @module routes/index
 * @description Root router that mounts all versioned sub-routers and applies
 * the version negotiation middleware.
 *
 * Request flow:
 * 1. {@link versionNegotiationMiddleware} resolves the API version from the URL
 *    or `Accept-Version` header and rewrites unversioned paths accordingly.
 * 2. Versioned routers (`/v1`, `/v2`) pick up the resolved request and delegate
 *    to the appropriate controller.
 */

import { Router } from 'express';
import v1Router from './v1/index.js';
import v2Router from './v2/index.js';
import { versionNegotiationMiddleware } from "middlewares/VersionNegotiation.js";

const router = Router();

// Version negotiation runs before all route handlers.
// It reads the Accept-Version header and rewrites unversioned URLs to include
// the resolved version prefix so the correct versioned router handles the request.
router.use(versionNegotiationMiddleware);

router.use('/v1', v1Router);
router.use('/v2', v2Router);

export default router;