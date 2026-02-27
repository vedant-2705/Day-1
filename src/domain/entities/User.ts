/**
 * @module User
 * @description Domain entity representing a registered application user.
 *
 * This is the *raw* domain model and includes sensitive fields such as `passwordHash`.
 * It should never be sent to the client - use {@link UserDTO} for external responses.
 */
import { UserRole } from "generated/prisma/enums.js";

export interface User {
    /** Unique user identifier (CUID). */
    id: string;

    /** Display name of the user. */
    name: string;

    /** Unique email address used for authentication. */
    email: string;

    /**
     * Bcrypt hash of the user's password.
     * Never expose this field in API responses - use {@link UserDTO} instead.
     */
    passwordHash: string;

    /** Access role that governs what the user is permitted to do. */
    role: UserRole;

    /**
     * CDN URL of the user's profile picture.
     * Null if the user has not uploaded one yet.
     * Updated by UploadProfilePictureUseCase.
     */
    profilePicture: string | null;
    /**
     * Storage provider key for the profile picture (Cloudinary public_id or local path).
     * Stored separately from the public URL so the old asset can be deleted before
     * uploading a new one. Never exposed in API responses.
     */
    profilePicturePath: string | null;

    /** Timestamp when the user account was created. */
    createdAt: Date;

    /** Timestamp of the last update to this user record. */
    updatedAt: Date;
}