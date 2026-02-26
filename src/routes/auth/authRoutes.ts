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

// Public routes - no auth required
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

router.post(
    "/refresh",
    asyncHandler((req, res, next) => controller().refresh(req, res, next)),
);

// Semi-protected - logout works even with invalid token (clears cookie regardless)
router.post(
    "/logout",
    asyncHandler((req, res, next) => controller().logout(req, res, next)),
);

// Protected - requires valid access token
// AuthMiddleware added in Step 6 after it's built
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
