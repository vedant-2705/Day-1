/**
 * @module IUserRepository
 * @description Defines the persistence contract for user data access.
 *
 * Most methods return the safe {@link UserDTO} (no `passwordHash`).
 * The sole exception is {@link findRawByEmail}, which returns the raw {@link User}
 * entity and must only be used where password verification is required.
 */
import { User } from "domain/entities/User.js";
import { CreateUserDTO, UserDTO } from "dto/UserDTO.js";
import { UserRole } from "generated/prisma/enums.js";

export interface IUserRepository {
    /**
     * Finds a user by their unique ID.
     * Returns a safe {@link UserDTO} - `passwordHash` is excluded.
     *
     * @param id The CUID of the user to look up.
     * @returns The matching {@link UserDTO}, or `null` if not found.
     */
    findById(id: string): Promise<UserDTO | null>;

    /**
     * Finds a user by their email address.
     * Returns a safe {@link UserDTO} - `passwordHash` is excluded.
     *
     * @param email The email address to look up.
     * @returns The matching {@link UserDTO}, or `null` if not found.
     */
    findByEmail(email: string): Promise<UserDTO | null>;

    /**
     * Creates a new user record from the supplied DTO.
     *
     * @param data Registration data including the pre-hashed password.
     * @returns The newly created user as a safe {@link UserDTO}.
     */
    create(data: CreateUserDTO): Promise<UserDTO>;

    /**
     * Checks whether a user with the given email already exists.
     * Used during registration to enforce unique email addresses.
     *
     * @param email The email address to check.
     * @returns `true` if a user with that email exists, `false` otherwise.
     */
    existsByEmail(email: string): Promise<boolean>;

    /**
     * Finds a user by email and returns the *raw* {@link User} domain entity,
     * including the `passwordHash` field.
     *
     * **Use only in `LoginUseCase`** where the hash must be compared against the
     * supplied plain-text password. Never expose this method's result to the client.
     *
     * @param email The email address to look up.
     * @returns The raw {@link User} entity (with `passwordHash`), or `null` if not found.
     */
    findRawByEmail(email: string): Promise<User | null>;

    /**
     * Updates the role of an existing user.
     * Used by `PromoteUserUseCase` to elevate a `USER` to `ADMIN`.
     *
     * @param id   The CUID of the user to update.
     * @param role The new role to assign.
     * @returns The updated {@link UserDTO}, or `null` if no user with that ID exists.
     */
    updateRole(id: string, role: UserRole): Promise<UserDTO | null>;

    /**
     * Updates the hashed password for a user.
     * Used by {@link ChangePasswordUseCase} (keeps current session) and
     * {@link ResetPasswordUseCase} (revokes all sessions).
     *
     * The password must be hashed by the caller before passing it here -
     * this method stores whatever hash it receives without further processing.
     *
     * @param id           The CUID of the user whose password should be updated.
     * @param passwordHash The bcrypt hash of the new password.
     */
    updatePassword(id: string, passwordHash: string): Promise<void>;

    /**
     * Updates the user's profile picture URL and storage path.
     * Called by UploadProfilePictureUseCase after a successful storage upload.
     *
     * @param id               - User CUID.
     * @param publicUrl        - CDN URL to display in the client (stored in profilePicture).
     * @param storagePath      - Provider storage key used for future deletion
     *                           (stored in profilePicturePath, never returned to clients).
     */
    updateProfilePicture(
        id: string,
        publicUrl: string,
        storagePath: string
    ): Promise<void>;

}

/** DI token used to resolve {@link IUserRepository} from the tsyringe container. */
export const USER_REPOSITORY = Symbol.for("IUserRepository"); 
