import { CookieOptions } from "express";

/**
 * HttpOnly    - JavaScript cannot read this cookie. XSS-proof.
 * Secure      - Only sent over HTTPS. Set false in dev, true in prod.
 * SameSite    - 'strict' prevents CSRF. Cookie only sent on same-site requests.
 * Path        - Cookie only sent to /api/auth routes. Not attached to every request.
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

export function getClearCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "strict",
        path: "/api/auth",
    };
}
