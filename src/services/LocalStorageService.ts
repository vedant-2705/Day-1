/**
 * @module LocalStorageService
 * @description Development fallback storage provider that writes files to disk.
 *
 * Use when STORAGE_PROVIDER=local in .env (no Cloudinary credentials needed).
 * Files are served by Express static middleware at /uploads/*.
 *
 * Folder structure mirrors Cloudinary convention:
 *   uploads/{env}/crm-lite/{userId}/{type}/{timestamp}-{nanoid}.ext
 *
 * This service is intentionally simple - no retry logic, no transformation.
 * Image resizing and format conversion are skipped in local mode.
 */

import fs from "fs/promises";
import path from "path";
import { injectable } from "tsyringe";
import { IStorageService } from "interfaces/services/IStorageService.js";
import { config } from "config/env.js";
import { DeleteOptions, UploadOptions, UploadResult } from "types/storage/index.js";

/** Root directory for local file storage. Resolved relative to project root. */
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

/** Maps MIME types to file extensions for local storage. */
const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
    "application/msword": ".doc",
};

@injectable()
export class LocalStorageService implements IStorageService {
    /**
     * Writes the file buffer to disk under the uploads/ directory.
     * Creates intermediate directories if they don't exist.
     */
    async upload(
        buffer: Buffer,
        mimeType: string,
        options: UploadOptions,
    ): Promise<UploadResult> {
        const ext = MIME_TO_EXT[mimeType] ?? "";
        const relativePath = `${options.folder}${options.fileName}${ext}`;
        const absolutePath = path.join(UPLOADS_ROOT, relativePath);

        // Ensure directory exists (recursive mkdir is safe if already exists)
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, buffer);

        // Build the URL that Express static middleware will serve
        const publicUrl = `${config.appUrl}/uploads/${relativePath}`;

        return {
            storagePath: relativePath,
            publicUrl,
            mimeType,
            sizeBytes: buffer.length,
        };
    }

    /**
     * Deletes a file from the local uploads directory.
     * Silently ignores ENOENT (file already gone).
     */
    async delete(options: DeleteOptions): Promise<void> {
        const absolutePath = path.join(UPLOADS_ROOT, options.storagePath);
        try {
            await fs.unlink(absolutePath);
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
                console.error("[LocalStorage] Delete failed:", err);
            }
        }
    }
}
