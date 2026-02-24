/**
 * @module contactValidator
 * @description Zod schemas for validating contact request payloads.
 * Schemas are used by the validation middleware before requests reach the controller.
 * Inferred TypeScript types are exported alongside schemas to ensure type safety
 * throughout the use-case layer.
 */

import { z } from "zod";

/** Allows only letters and spaces — rejects numbers and special characters. */
const phoneRegex = /^[1-9][0-9]{9}$/;

/** 10-digit phone number starting with a non-zero digit (no country code). */
const nameRegex = /^[a-zA-Z\s]+$/;

/** Validates the request body for POST /contacts. */
export const createContactSchema = z.object({
    name: z
        .string({ error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .regex(nameRegex, "Name can only contain letters and spaces"),

    email: z
        .string({ error: "Email is required" })
        .trim()
        .email("Invalid email address")
        .toLowerCase(),

    phone: z
        .string({ error: "Phone is required" })
        .trim()
        .regex(phoneRegex, "Invalid phone number format"),

    address: z
        .string({ error: "Address is required" })
        .trim()
        .min(5, "Address must be at least 5 characters")
        .max(300, "Address must be at most 300 characters"),
});

/**
 * Validates the request body for PATCH /contacts/:id.
 * All fields from {@link createContactSchema} are optional, but at least one must be present.
 */
export const updateContactSchema = createContactSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
    });

/** Validates that the `id` route param is a valid UUID. Applied to all /:id routes. */
export const uuidSchema = z.object({
    id: z.uuid("Invalid contact ID format"),
});

/** TypeScript type inferred from {@link createContactSchema}. Used as the input type for contact creation. */
export type CreateContactDTO = z.infer<typeof createContactSchema>;

/** TypeScript type inferred from {@link updateContactSchema}. Used as the input type for contact updates. */
export type UpdateContactDTO = z.infer<typeof updateContactSchema>;
