import { Router } from 'express';
import v1Router from './v1/index.js';
import v2Router from './v2/index.js';
import { versionNegotiationMiddleware } from "middlewares/VersionNegotiation.js";

const router = Router();

// Header-based version negotiation runs first
// It reads the Accept-Version header and rewrites the request
// so downstream code knows which version was requested
router.use(versionNegotiationMiddleware);

router.use('/v1', v1Router);
router.use('/v2', v2Router);

export default router;