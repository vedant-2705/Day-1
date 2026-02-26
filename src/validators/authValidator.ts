import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    email: z.email("Invalid email format").max(255),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password cannot exceed 72 characters") // bcrypt hard limit
        .regex(
            passwordRegex,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        ),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
