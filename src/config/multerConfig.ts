/**
 * @module multerConfig
 * @description Multer instance factories for profile and document uploads.
 *
 * Design decisions:
 *  - memoryStorage(): files live as Buffer in RAM - never touch disk.
 *    No temp file cleanup, no race conditions, works across multiple instances.
 *  - fileFilter: preliminary MIME type check from the Content-Type header.
 *    This is a first-pass guard only - magic-byte validation in the use case
 *    is the authoritative check and cannot be bypassed.
 *  - limits.fileSize: enforced at the HTTP layer before the buffer is fully read,
 *    so oversized files are rejected early without consuming bandwidth.
 *  - Single-file upload only (upload.single()) - no multi-file attack surface.
 */

import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { FileCategory, getAllowedMimeTypes } from "validators/fileValidator.js";

// -------------------------------------------------------------------
// Size limits (read from env so they can be tuned without a deploy)
// -------------------------------------------------------------------

/** Profile picture max size in bytes. Default: 5 MB. */
const MAX_PROFILE_SIZE =
    (parseInt(process.env["MAX_PROFILE_SIZE_MB"] ?? "5", 10) || 5) *
    1024 *
    1024;

/** Document max size in bytes. Default: 10 MB. */
const MAX_DOCUMENT_SIZE =
    (parseInt(process.env["MAX_DOCUMENT_SIZE_MB"] ?? "10", 10) || 10) *
    1024 *
    1024;

// -------------------------------------------------------------------
// Multer factory
// -------------------------------------------------------------------

/**
 * Creates a Multer middleware configured for a specific file category.
 *
 * @param category - "image" or "document" - drives MIME filtering and size limits.
 * @returns A Multer instance accepting a single file in the `file` field.
 *
 * @remarks
 * The returned instance should be used via `.single("file")` in the route:
 *   `router.post("/profile", createMulter("image").single("file"), ...)`
 */
function createMulter(category: FileCategory) {
    const allowedMimes = getAllowedMimeTypes(category);
    const maxSize = category === "image" ? MAX_PROFILE_SIZE : MAX_DOCUMENT_SIZE;

    return multer({
        storage: multer.memoryStorage(),

        limits: {
            fileSize: maxSize,
            files: 1, // single file only
        },

        fileFilter(
            _req: Request,
            file: Express.Multer.File,
            cb: FileFilterCallback,
        ) {
            // Preliminary MIME check - client-controlled but useful for clear error messages.
            // The authoritative check (magic bytes) happens after the buffer is in memory.
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                // Pass null (not an Error) to suppress Multer's own error - we throw our own.
                // Using a typed error here so the UploadMiddleware can detect it.
                const err = new Error(
                    `Unsupported MIME type "${file.mimetype}". Allowed: ${allowedMimes.join(", ")}`,
                );
                err.name = "MIME_TYPE_ERROR";
                cb(err as unknown as null, false);
            }
        },
    });
}

/** Multer instance pre-configured for profile picture uploads. */
export const profileUpload = createMulter("image");

/** Multer instance pre-configured for document uploads. */
export const documentUpload = createMulter("document");
