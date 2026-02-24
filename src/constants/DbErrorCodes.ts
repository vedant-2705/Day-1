/**
 * @module DbErrorCodes
 * @description Constants for Prisma/Database error codes to avoid magic strings.
 * Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
 * 
 */

export const DbErrorCodes = {
    /**
     * Unique constraint failed.
     * Occurs when trying to create a record with a field that must be unique (e.g. email).
     */
    UNIQUE_CONSTRAINT_VIOLATION: "P2002",

    /**
     * Record not found.
     * Occurs when using findUniqueOrThrow() or updating a non-existent record.
     */
    RECORD_NOT_FOUND: "P2025",

    /**
     * Foreign key constraint failed.
     * Occurs when linking to a record that doesn't exist (e.g. invalid userId).
     */
    FOREIGN_KEY_VIOLATION: "P2003",
} as const;
