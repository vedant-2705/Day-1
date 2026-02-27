/**
 * @module cookieOptions
 * @description Factory functions that produce Express `CookieOptions` for the
 * HttpOnly refresh-token cookie.
 *
 * Centralising cookie configuration here ensures that both the `set` and `clear`
 * calls always use the same `path`, `sameSite`, and `secure` values. Mismatches
 * between those options would cause the browser to treat them as different cookies,
 * silently failing to clear the session on logout.
 */
import { CookieOptions } from "express";

/**
 * Returns cookie options for setting the refresh token after a successful login or rotation.
 *
 * - `httpOnly`  - JavaScript cannot read this cookie, protecting against XSS token theft.
 * - `secure`    - Only transmitted over HTTPS; disabled in non-production environments.
 * - `sameSite`  - `strict` prevents CSRF; the cookie is never sent on cross-site requests.
 * - `path`      - Scoped to `/api/auth` so the cookie is not attached to every API request.
 * - `expires`   - Absolute expiry timestamp derived from the refresh token's DB record.
 *
 * @param expiresAt Absolute expiry date for the cookie, matching the token's `expiresAt` DB field.
 */
export function getRefreshCookieOptions(expiresAt: Date): CookieOptions {
    return {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "strict",
        expires: expiresAt,
        path: "/api/auth", 
    };
}

/**
 * Returns cookie options for clearing the refresh token on logout.
 *
 * Must use the **same** `path`, `sameSite`, and `secure` values as {@link getRefreshCookieOptions};
 * otherwise the browser will not find the cookie to delete it.
 */
export function getClearCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "strict",
        path: "/api/auth",
    };
}
