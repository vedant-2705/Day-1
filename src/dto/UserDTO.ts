/**
 * @module UserDTO
 * @description Data Transfer Objects for user persistence and API response operations.
 * DTOs decouple the service/repository layer from internal domain models and
 * ensure that sensitive fields (e.g. `passwordHash`) are never accidentally exposed.
 */
import { UserRole } from "generated/prisma/enums.js";

/**
 * Input shape for creating a new user record.
 * Used by {@link IUserRepository.create} during the registration flow.
 */
export interface CreateUserDTO {
    /** Display name provided by the user at registration. */
    name: string;

    /** Unique email address that will be used as the login identifier. */
    email: string;

    /**
     * Pre-hashed password (bcrypt).
     * The plain-text password must be hashed before constructing this DTO.
     */
    passwordHash: string;

    /**
     * Access role to assign the user.
     * Defaults to `USER` if omitted.
     */
    role?: UserRole;
}

/**
 * Safe public representation of a user - suitable for API responses.
 * Does NOT include `passwordHash` or other sensitive fields.
 */
export interface UserDTO {
    /** Unique user identifier (CUID). */
    id: string;

    /** Display name of the user. */
    name: string;

    /** Email address of the user. */
    email: string;

    /** Access role of the user. */
    role: UserRole;

    /** Timestamp when the user account was created. */
    createdAt: Date;

    /** Timestamp of the last update to this user record. */
    updatedAt: Date;

    profilePicture: string | null;
    profilePicturePath: string | null;
}
