/**
 * @module VersionNegotiation
 * @description Express middleware that implements dual-strategy API versioning.
 *
 * Two versioning strategies are supported, with URL versioning taking priority:
 * 1. **URL versioning** (explicit): `/v1/contacts`, `/v2/contacts` - routes directly
 *    to the matching versioned router with no header inspection needed.
 * 2. **Header versioning** (negotiated): unversioned paths like `/contacts` paired
 *    with an `Accept-Version: v2` header - the middleware rewrites the URL to the
 *    resolved version before handing off to the versioned router.
 *
 * Unrecognised version values in the `Accept-Version` header result in a 400 response
 * rather than a silent fallback, ensuring clients are notified of misconfiguration.
 */

import { Request, Response, NextFunction } from "express";

/** All API versions this application currently supports, in ascending order. */
const SUPPORTED_VERSIONS = ["v1", "v2"] as const;

/** Version resolved when no `Accept-Version` header is provided. */
const DEFAULT_VERSION = "v1";

/** Alias for the most recent stable version, resolved when `Accept-Version: latest` is sent. */
const LATEST_VERSION = "v2";

type Version = (typeof SUPPORTED_VERSIONS)[number];

/**
 * Type guard that checks whether a string is a valid, supported API version.
 * @param v - The raw string to validate.
 * @returns `true` if `v` is a member of {@link SUPPORTED_VERSIONS}.
 */
function isValidVersion(v: string): v is Version {
    return (SUPPORTED_VERSIONS as readonly string[]).includes(v);
}

/**
 * Express middleware that resolves the API version for the incoming request.
 *
 * @param req  - The Express request object. The `url` property may be rewritten
 *               to prepend the resolved version prefix.
 * @param res  - The Express response object. The `X-API-Version` response header
 *               is set to the resolved version for client and logging visibility.
 * @param next - Calls the next middleware or route handler on success.
 *
 * @remarks
 * Resolution order:
 * 1. If the URL already starts with a known version prefix (`/v1/`, `/v2/`),
 *    the middleware is a no-op and calls `next()` immediately.
 * 2. If `Accept-Version: latest` is sent, the request is routed to {@link LATEST_VERSION}.
 * 3. If a recognised version string is sent, it is used directly.
 * 4. If an unrecognised version is sent, a 400 error is returned immediately.
 * 5. If no header is present, {@link DEFAULT_VERSION} is used as the fallback.
 */
export function versionNegotiationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    // URL versioning takes priority over header negotiation.
    // If the path already includes a version prefix, skip header inspection entirely.
    const urlAlreadyVersioned = SUPPORTED_VERSIONS.some(
        (v) => req.path.startsWith(`/${v}/`) || req.path === `/${v}`,
    );

    if (urlAlreadyVersioned) {
        next();
        return;
    }

    // Read the Accept-Version request header for header-based negotiation
    const headerVersion = req.headers["accept-version"] as string | undefined;

    let resolvedVersion: Version = DEFAULT_VERSION;

    if (headerVersion) {
        const normalized = headerVersion.toLowerCase().trim();

        if (normalized === "latest") {
            resolvedVersion = LATEST_VERSION;
        } else if (isValidVersion(normalized)) {
            resolvedVersion = normalized;
        } else {
            // Unknown version - return 400 rather than silently falling back to a default.
            // Clients should be informed of misconfiguration rather than silently receiving
            // responses from an unintended API version.
            res.status(400).json({
                success: false,
                error: {
                    code: "UNSUPPORTED_VERSION",
                    message: `API version '${headerVersion}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(", ")}`,
                },
            });
            return;
        }
    }

    // Rewrite the URL so downstream code routes through the correct versioned router.
    // e.g. `GET /contacts` with `Accept-Version: v2` becomes `GET /v2/contacts` internally.
    req.url = `/${resolvedVersion}${req.url}`;

    // Expose the resolved version in the response so clients can confirm which
    // version served the request - useful for debugging and observability.
    res.setHeader("X-API-Version", resolvedVersion);

    next();
}
