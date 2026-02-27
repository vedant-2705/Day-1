/**
 * @module authValidator
 * @description Zod validation schemas for authentication request bodies.
 *
 * Schemas are used by {@link ValidationMiddleware} to parse and validate incoming
 * requests before they reach the controller. If validation fails, a 422 response
 * is returned automatically - the use case never sees invalid input.
 *
 * Inferred TypeScript types (`RegisterInput`, `LoginInput`) are exported so that
 * controllers and use cases can type-check request payloads without duplicating
 * the field definitions.
 */
import { z } from "zod";

/**
 * Enforces minimum password complexity:
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Validation schema for `POST /api/auth/register`.
 *
 * Rules:
 * - `name`     - required, 1–255 characters.
 * - `email`    - valid email format, max 255 characters.
 * - `password` - 8–72 characters (72 is bcrypt's hard input limit),
 *                must contain at least one uppercase letter, one lowercase letter,
 *                and one digit.
 */
export const registerSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    email: z.email("Invalid email format").max(255),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password cannot exceed 72 characters") // bcrypt truncates input beyond 72 bytes
        .regex(
            passwordRegex,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        ),
});

/**
 * Validation schema for `POST /api/auth/login`.
 *
 * Intentionally minimal - we avoid leaking which specific field is wrong
 * in the authentication error response to prevent user enumeration.
 */
export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),

        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(72, "Password cannot exceed 72 characters")
            .regex(
                passwordRegex,
                "Password must contain at least one uppercase letter, one lowercase letter, and one number",
            ),

        confirmPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // error shown on confirmPassword field
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from current password",
        path: ["newPassword"],
    });

export const forgotPasswordSchema = z.object({
    email: z.email("Invalid email format"),
});

export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, "Reset token is required"),

        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(72, "Password cannot exceed 72 characters")
            .regex(
                passwordRegex,
                "Password must contain at least one uppercase letter, one lowercase letter, and one number",
            ),

        confirmPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Inferred type for the validated register request body. */
export type RegisterInput = z.infer<typeof registerSchema>;

/** Inferred type for the validated login request body. */
export type LoginInput = z.infer<typeof loginSchema>;
