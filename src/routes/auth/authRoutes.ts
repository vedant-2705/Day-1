/**
 * @module authRoutes
 * @description Defines all `/api/auth` routes.
 *
 * Route protection levels:
 * - Public         - no token required (register, login, refresh)
 * - Semi-protected - logout works regardless of token validity (clears cookie unconditionally)
 * - Protected      - valid access token required (logout-all, me)
 */
import { Router } from "express";
import { AuthController } from "controllers/auth/AuthController.js";
import { asyncHandler } from "middlewares/AsyncHandler.js";
import { validate } from "middlewares/ValidationMiddleware.js";
import { registerSchema, loginSchema } from "validators/authValidator.js";
import { resolveController } from "helpers/ControllerResolver.js";
import { authMiddleware } from "middlewares/AuthMiddleware.js";
import { requestContextMiddleware } from "middlewares/RequestContextMiddleware.js";

const router = Router();
const controller = resolveController(AuthController);

// ---------------------------------------------------------------------------
// Public routes - no authentication required
// ---------------------------------------------------------------------------

router.post(
    "/register",
    validate(registerSchema),
    asyncHandler((req, res, next) => controller().register(req, res, next)),
);

router.post(
    "/login",
    validate(loginSchema),
    asyncHandler((req, res, next) => controller().login(req, res, next)),
);

// Reads the refresh token from the HttpOnly cookie - no Authorization header needed
router.post(
    "/refresh",
    asyncHandler((req, res, next) => controller().refresh(req, res, next)),
);

// ---------------------------------------------------------------------------
// Semi-protected - logout is intentionally open so the cookie is always cleared
// even when the access token is missing or expired
// ---------------------------------------------------------------------------

router.post(
    "/logout",
    asyncHandler((req, res, next) => controller().logout(req, res, next)),
);

// ---------------------------------------------------------------------------
// Protected - valid access token required
// ---------------------------------------------------------------------------

router.post(
    "/logout-all",
    authMiddleware,
    requestContextMiddleware,
    asyncHandler((req, res, next) => controller().logoutAll(req, res, next)),
);

router.get(
    "/me",
    authMiddleware,
    requestContextMiddleware,
    asyncHandler((req, res, next) => controller().me(req, res, next)),
);

export { router as authRoutes };
