import { Request, Response, NextFunction } from "express";

// Supported versions in order of preference
const SUPPORTED_VERSIONS = ["v1", "v2"] as const;
const DEFAULT_VERSION = "v1";
const LATEST_VERSION = "v2";

type Version = (typeof SUPPORTED_VERSIONS)[number];

function isValidVersion(v: string): v is Version {
    return (SUPPORTED_VERSIONS as readonly string[]).includes(v);
}

export function versionNegotiationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    // If the URL already has /v1 or /v2 prefix, skip header negotiation
    // URL versioning takes priority over header versioning
    const urlAlreadyVersioned = SUPPORTED_VERSIONS.some(
        (v) => req.path.startsWith(`/${v}/`) || req.path === `/${v}`,
    );

    if (urlAlreadyVersioned) {
        next();
        return;
    }

    // Read the Accept-Version header
    const headerVersion = req.headers["accept-version"] as string | undefined;

    let resolvedVersion: Version = DEFAULT_VERSION;

    if (headerVersion) {
        const normalized = headerVersion.toLowerCase().trim();

        if (normalized === "latest") {
            resolvedVersion = LATEST_VERSION;
        } else if (isValidVersion(normalized)) {
            resolvedVersion = normalized;
        } else {
            // Unknown version - return 400 rather than silently falling back.
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

    // Rewrite the URL so it routes through the versioned router
    // e.g. GET /contacts with Accept-Version: v2
    //   becomes GET /v2/contacts internally
    req.url = `/${resolvedVersion}${req.url}`;

    // Expose which version was resolved - useful for clients and logging
    res.setHeader("X-API-Version", resolvedVersion);

    next();
}
