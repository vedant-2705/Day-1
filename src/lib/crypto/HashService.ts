import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";

/**
 * HashService handles two distinct hashing concerns:
 *
 * Passwords   -> bcrypt (slow, salted - protects against brute force on predictable input)
 * Tokens      -> SHA-256 (fast - input is already a 32-byte random value, brute force is infeasible)
 */
export class HashService {
    private static readonly BCRYPT_ROUNDS = 12;

    // Password hashing

    /**
     * Hashes a plain-text password using bcrypt.
     * bcrypt automatically generates and embeds a unique salt,
     * so two hashes of the same password will always differ.
     */
    static async hashPassword(plain: string): Promise<string> {
        return bcrypt.hash(plain, this.BCRYPT_ROUNDS);
    }

    /**
     * Compares a plain-text password against a stored bcrypt hash.
     * Safe against timing attacks - bcrypt.compare runs in constant time.
     */
    static async comparePassword(
        plain: string,
        hash: string,
    ): Promise<boolean> {
        return bcrypt.compare(plain, hash);
    }

    // Token generation + hashing

    /**
     * Generates a cryptographically secure random token.
     * This is what gets sent to the client as the refresh token.
     * 32 bytes = 256 bits of entropy - infeasible to brute force.
     */
    static generateToken(): string {
        return randomBytes(32).toString("hex");
    }

    /**
     * Hashes a token using SHA-256 for safe DB storage.
     * We store the hash, never the plain token.
     * If the DB is compromised, hashes are useless without the originals.
     */
    static hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }
}
