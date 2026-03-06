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
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from "validators/authValidator.js";
import { resolveController } from "helpers/ControllerResolver.js";
import { authMiddleware } from "middlewares/AuthMiddleware.js";
import { requestContextMiddleware } from "middlewares/RequestContextMiddleware.js";
import { authRateLimit } from "middlewares/RateLimitMiddleware.js";

const router = Router();
const controller = resolveController(AuthController);

// ---------------------------------------------------------------------------
// Public routes - no authentication required
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Creates a new USER account and immediately issues a token pair. No separate login step required after registration.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly refresh token cookie scoped to /api/auth
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "clxyz123"
 *                   name: "Jane Doe"
 *                   email: "jane@example.com"
 *                   role: "USER"
 *                   createdAt: "2026-01-15T10:00:00.000Z"
 *                   updatedAt: "2026-01-15T10:00:00.000Z"
 *                 accessToken: "eyJhbGciOiJIUzI1NiJ9..."
 *               meta:
 *                 timestamp: "2024-01-15T10:00:00.000Z"
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: "USER_EMAIL_TAKEN"
 *               detail: "An account with email 'jane@example.com' already exists"
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post(
    "/register",
    authRateLimit,
    validate(registerSchema),
    asyncHandler((req, res, next) => controller().register(req, res, next)),
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     description: Authenticates credentials and issues a JWT access token + HttpOnly refresh cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "clxyz123"
 *                   name: "Jane Doe"
 *                   email: "jane@example.com"
 *                   role: "USER"
 *                 accessToken: "eyJhbGciOiJIUzI1NiJ9..."
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: "INVALID_CREDENTIALS"
 *               detail: "Invalid email or password"
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post(
    "/login",
    authRateLimit,
    validate(loginSchema),
    asyncHandler((req, res, next) => controller().login(req, res, next)),
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate the refresh token and get a new access token
 *     description: |
 *       Reads the refresh token from the HttpOnly cookie (sent automatically by the browser).
 *       Rotates the token - the old token is immediately revoked.
 *       If a revoked token is replayed, ALL sessions for that user are invalidated (reuse detection).
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token rotated successfully
 *         headers:
 *           Set-Cookie:
 *             description: New HttpOnly refresh token cookie replacing the old one
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiJ9..."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    "/refresh",
    asyncHandler((req, res, next) => controller().refresh(req, res, next)),
);

// ---------------------------------------------------------------------------
// Semi-protected - logout is intentionally open so the cookie is always cleared
// even when the access token is missing or expired
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current device session
 *     description: |
 *       Revokes the current refresh token and clears the cookie.
 *       Always returns 200 - even if no cookie was present - so the client can treat logout as idempotent.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data: null
 */
router.post(
    "/logout",
    asyncHandler((req, res, next) => controller().logout(req, res, next)),
);

// ---------------------------------------------------------------------------
// Protected - valid access token required
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Log out all devices simultaneously
 *     description: Revokes every active refresh token for the authenticated user. All other devices will be signed out on their next request.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    "/logout-all",
    authMiddleware,
    requestContextMiddleware,
    asyncHandler((req, res, next) => controller().logoutAll(req, res, next)),
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     description: Returns the current user's profile. Also serves as a token validity check - a 401 means the access token has expired and /auth/refresh should be called.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
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
 *                 role: "USER"
 *                 profilePicture: "https://res.cloudinary.com/..."
 *                 createdAt: "2024-01-15T10:00:00.000Z"
 *                 updatedAt: "2024-01-15T10:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
    "/me",
    authMiddleware,
    requestContextMiddleware,
    asyncHandler((req, res, next) => controller().me(req, res, next)),
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (while authenticated)
 *     description: |
 *       Changes the password for the currently authenticated user.
 *       Requires the current password to prevent silent takeover on unattended devices.
 *       Revokes all OTHER sessions - the current device stays logged in.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed. Other sessions have been logged out.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: "Password changed successfully. Other sessions have been logged out."
 *       400:
 *         description: Current password incorrect, or new password same as current
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: "INVALID_CREDENTIALS"
 *               detail: "Current password is incorrect"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post(
    "/change-password",
    authMiddleware,
    requestContextMiddleware,
    validate(changePasswordSchema),
    asyncHandler((req, res, next) =>
        controller().changePassword(req, res, next),
    ),
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     description: |
 *       Generates a one-time reset token and (in production) emails it to the user.
 *       **Anti-enumeration**: always returns the same message regardless of whether the email is registered.
 *       In non-production environments, `devOnly_resetLink` is included in the response for testing.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Generic confirmation (same response whether email exists or not)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: "If this email is registered, you will receive a password reset link shortly"
 *                 devOnly_resetLink: "http://localhost:3000/reset-password?token=abc123"
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    asyncHandler((req, res, next) =>
        controller().forgotPassword(req, res, next),
    ),
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using the emailed token
 *     description: |
 *       Completes the password reset flow. The token from the reset link acts as the credential.
 *       Revokes ALL active sessions (including current device) - account may be compromised.
 *       Token is single-use and expires after 1 hour.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset. Please log in with your new password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: "Password reset successful. Please log in with your new password."
 *       400:
 *         description: Token not found, expired, or already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: "INVALID_RESET_TOKEN"
 *               detail: "Password reset link is invalid or has expired"
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post(
    "/reset-password",
    validate(resetPasswordSchema),
    asyncHandler((req, res, next) =>
        controller().resetPassword(req, res, next),
    ),
);

export { router as authRoutes };