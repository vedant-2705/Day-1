/**
 * @module JwtService
 * @description Injectable service responsible for signing and verifying JWT access tokens,
 * and for exposing refresh-token configuration values used by the auth use cases.
 *
 * Access tokens are short-lived JWTs (default 15 minutes) signed with an HMAC-SHA256 secret.
 * Refresh tokens are **not** JWTs - they are opaque random strings managed by
 * {@link HashService} and stored as hashes in the database. This service only provides
 * the expiry calculation and cookie-name lookup for those tokens.
 */
import jwt from "jsonwebtoken";
import { singleton } from "tsyringe";
import { UserRole } from "generated/prisma/client.js";
import { config } from "config/env.js";

// ---------------------------------------------------------------------------
// Token payload shapes
// ---------------------------------------------------------------------------

/** Data embedded in every signed access token. */
export interface AccessTokenPayload {
    userId: string;
    email: string;
    role: UserRole;
}

/**
 * Full decoded access token - extends {@link AccessTokenPayload} with standard JWT claims
 * (`iat` and `exp`) added automatically by `jsonwebtoken` during signing.
 */
export interface DecodedAccessToken extends AccessTokenPayload {
    /** Issued-at timestamp (Unix epoch seconds). */
    iat: number;
    /** Expiry timestamp (Unix epoch seconds). */
    exp: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@singleton()
export class JwtService {

    // --- Access token ---
    /**
     * Signs a short-lived access token (default 15m).
     * Contains userId, email, role - everything AuthMiddleware needs
     * to authenticate and authorize without hitting the DB.
     */
    signAccessToken(payload: AccessTokenPayload): string {
        return jwt.sign(payload, config.jwtAccessSecret, {
            expiresIn: config.jwtAccessExpiry,
        });
    }

    /**
     * Verifies an access token signature and expiry.
     * Returns the decoded payload or throws if invalid/expired.
     */
    verifyAccessToken(token: string): DecodedAccessToken {
        return jwt.verify(
            token,
            config.jwtAccessSecret,
        ) as DecodedAccessToken;
    }

    // --- Refresh token ---
    // Refresh tokens are opaque random strings, not JWTs.
    // JwtService doesn't sign them - HashService generates and hashes them.
    // These helpers exist only to expose config values needed by use cases.

    /**
     * Calculates the absolute expiry `Date` for a new refresh token.
     * Parses the human-readable expiry string from config (e.g. `"7d"`) into a future timestamp.
     */
    getRefreshTokenExpiry(): Date {
        // Parse "7d" -> Date 7 days from now
        return this.parseExpiry(config.jwtRefreshExpiry);
    }

    /** Returns the cookie name used for the HttpOnly refresh-token cookie, as defined in config. */
    getCookieName(): string {
        return config.refreshTokenCookieName;
    }

    // Helpers

    /**
     * Parses simple expiry strings like "15m", "7d", "1h" into a future Date.
     * Used to set the `expires_at` column on refresh token rows
     * and the `maxAge` on the HttpOnly cookie.
     */
    private parseExpiry(expiry: string): Date {
        const unit = expiry.slice(-1); // "d", "h", "m"
        const value = parseInt(expiry.slice(0, -1), 10);

        const ms: Record<string, number> = {
            d: 24 * 60 * 60 * 1000,
            h: 60 * 60 * 1000,
            m: 60 * 1000,
        };

        if (!ms[unit] || isNaN(value)) {
            throw new Error(`Invalid expiry format: ${expiry}`);
        }

        return new Date(Date.now() + value * ms[unit]);
    }
}

export const JWT_SERVICE = Symbol.for("JwtService");