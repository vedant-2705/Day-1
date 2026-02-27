/**
 * @module types/auth
 * @description Shared type definitions for the authentication system.
 *
 * These types define the data contracts between auth use cases, the controller,
 * and any downstream consumers. Keeping them in a dedicated module prevents
 * circular imports between use cases and controllers.
 */
import { UserDTO } from "dto/UserDTO.js";

/**
 * A pair of tokens issued after a successful login, registration, or token rotation.
 *
 * - `accessToken`  - short-lived JWT returned in the response body; the client stores
 *   it in memory and sends it in the `Authorization: Bearer` header.
 * - `refreshToken` - long-lived opaque random string sent as an HttpOnly cookie;
 *   used exclusively to rotate the token pair via `/api/auth/refresh`.
 */
export interface TokenPair {
    /** Short-lived JWT. Sent in the response body; client stores in memory. */
    accessToken: string;
    /** Long-lived opaque token. Sent as an HttpOnly cookie; never accessible to JS. */
    refreshToken: string;
}

/**
 * Full result returned by register and login use cases.
 * Extends {@link TokenPair} with the safe user profile so the client can
 * display user information without a separate `/me` request.
 */
export interface AuthResult {
    /** Safe user profile - no sensitive fields such as `passwordHash`. */
    user: UserDTO;
    /** Short-lived JWT access token. */
    accessToken: string;
    /** Long-lived opaque refresh token (raw - before hashing). */
    refreshToken: string;
}

/**
 * Request context captured at the HTTP layer and forwarded to use cases
 * for audit logging and session tracking.
 */
export interface RequestContext {
    /** Client IP address (direct socket or `X-Forwarded-For` from a proxy). */
    ip: string | null;
    /** Raw `User-Agent` header value. */
    userAgent: string | null;
}
