/**
 * @module UserRole
 * @description Defines the access roles available to application users.
 * Used in authorization checks to gate admin-only endpoints.
 */
export enum UserRole {
    /** Default role assigned to every newly registered user. */
    USER = "USER",

    /** Elevated role with access to admin-only operations (e.g. promoting other users). */
    ADMIN = "ADMIN",
}