import { z } from "zod";

const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}[0-9]$/;

export const createContactSchema = z.object({
    name: z
        .string({ error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters"),

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

export const updateContactSchema = createContactSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
    });

export const uuidSchema = z.object({
    id: z.uuid("Invalid contact ID format"),
});

export type CreateContactDTO = z.infer<typeof createContactSchema>;
export type UpdateContactDTO = z.infer<typeof updateContactSchema>;
