/**
 * @module Contact
 * @description Core domain entity representing a contact record.
 * Maps directly to the `contacts` table in the database.
 */

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date; // Soft delete timestamp; null if not deleted
    /** Optimistic concurrency version - incremented on every update. */
    version: number;
    createdBy: string; // User ID of the creator
}