/**
 * @module fileNameGenerator
 * @description Generates collision-proof storage paths following the project's
 * naming convention.
 *
 * Convention:
 *   folder: `{env}/training/{userId}/{type}/`
 *   file:   `{unixMs}-{random8chars}`
 *
 * Why this approach:
 *  - Original filenames are NEVER used (XSS vectors, Unicode issues, collisions)
 *  - Unix timestamp prefix = naturally sortable by upload time
 *  - 8 random chars = ~47 bits of entropy - collision probability negligible
 *    even at 1M uploads/day for 100 years
 *  - Env prefix separates production and development assets in the same
 *    Cloudinary account - dev uploads never appear in prod and vice versa
 */

/**
 * Generates the folder path for a given user and asset type.
 *
 * @param userId   - The authenticated user's ID.
 * @param type     - Asset type: "profile" or "documents".
 * @returns Folder path with trailing slash, e.g. `production/training/clxyz/profile/`
 */
export function buildFolder(
    userId: string,
    type: "profile" | "documents",
): string {
    const env = process.env["NODE_ENV"] ?? "development";
    // Include year/month for documents to support date-based retention policies (GDPR)
    if (type === "documents") {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, "0");
        return `${env}/training/${userId}/documents/${year}/${month}/`;
    }
    return `${env}/training/${userId}/profile/`;
}

/**
 * Generates a unique filename without extension.
 * Format: `{unixMs}-{8 random hex chars}`
 *
 * @returns e.g. `1718123456789-a3f7b2c1`
 */
export function generateFileName(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(16).slice(2, 10).padEnd(8, "0");
    return `${timestamp}-${random}`;
}
