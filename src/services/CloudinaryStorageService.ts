/**
 * @module CloudinaryStorageService
 * @description Production storage provider backed by Cloudinary.
 *
 * Features:
 *  - Uploads from Buffer (never touches disk)
 *  - Profile images: auto-converted to WebP, resized to max 400×400, quality auto
 *  - Documents:      uploaded as raw resource type (no transformation)
 *  - Exponential backoff retry (3 attempts, 500ms / 1s / 2s)
 *  - Folder convention: {env}/training/{userId}/{type}/
 *  - Returns storagePath (public_id) for future deletion
 */

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { injectable } from "tsyringe";
import { IStorageService } from "interfaces/services/IStorageService.js";
import { StorageUploadError } from "shared/errors/StorageUploadError.js";
import { DeleteOptions, UploadOptions, UploadResult } from "types/storage/index.js";
import { withRetry } from "lib/retry/RetryService.js";

// --------------------------------------------------------------------------------
// Cloudinary SDK configuration
// Called once at module load - safe because config values are static per process.
// --------------------------------------------------------------------------------
cloudinary.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
    api_key: process.env["CLOUDINARY_API_KEY"],
    api_secret: process.env["CLOUDINARY_API_SECRET"],
    secure: true, // always use https URLs
});

// --------------------------------------------------------------------------------
// Retry configuration
// --------------------------------------------------------------------------------
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

@injectable()
export class CloudinaryStorageService implements IStorageService {
    /**
     * Uploads a file buffer to Cloudinary with retry logic.
     *
     * Profile images are transformed on Cloudinary's side:
     *   - Converted to WebP (smaller, modern format)
     *   - Resized to max 400×400 (crop: "limit" preserves aspect ratio)
     *   - Quality set to "auto" (Cloudinary picks the optimal compression)
     *
     * Documents are uploaded as `resource_type: "raw"` - no transformation.
     */
    async upload(
        buffer: Buffer,
        mimeType: string,
        options: UploadOptions,
    ): Promise<UploadResult> {
        const folder = `${options.folder}`
        const publicId = `${options.fileName}`;

        const uploadOptions: Record<string, unknown> = {
            folder: folder,
            public_id: publicId,
            resource_type: options.resourceType === "image" ? "image" : "raw",
            overwrite: true,
            // Instruct Cloudinary to deliver the actual file bytes on raw uploads
            ...(options.resourceType === "document" && {
                type: "upload",
                access_mode: "public",
            }),
            // Image-specific transformations applied at upload time
            ...(options.resourceType === "image" && {
                format: "webp",
                transformation: [
                    {
                        width: 400,
                        height: 400,
                        crop: "limit", // shrink if larger, never upscale
                        quality: "auto", // Cloudinary picks optimal compression
                        fetch_format: "auto",
                    },
                ],
            }),
        };

        // const result = await this.uploadWithRetry(buffer, uploadOptions);

        const result = await withRetry(
            () => this.uploadBuffer(buffer, uploadOptions),
            {
                maxAttempts: 3,
                baseDelayMs: 500,
                maxDelayMs: 2000,
                isRetryable: (err) =>
                    // Retry transient network errors and Cloudinary 5xx responses.
                    // Do NOT retry 4xx (bad file, auth failure) - they will never succeed.
                    err.message.includes("ECONNRESET") ||
                    err.message.includes("ETIMEDOUT") ||
                    err.message.includes("socket hang up") ||
                    err.message.includes("500") ||
                    err.message.includes("503"),
            },
        );

        return {
            storagePath: result.public_id,
            publicUrl: result.secure_url,
            mimeType,
            sizeBytes: result.bytes,
            width: result.width,
            height: result.height,
        };
    }

    /**
     * Deletes an asset from Cloudinary by public_id.
     * Silently no-ops if the asset does not exist (safe for re-entrant cleanup).
     */
    async delete(options: DeleteOptions): Promise<void> {
        try {
            await cloudinary.uploader.destroy(options.storagePath, {
                resource_type:
                    options.resourceType === "image" ? "image" : "raw",
                invalidate: true, // purge from CDN cache
            });
        } catch (err: unknown) {
            // Log but don't throw - deletion failures should not break the caller
            console.error("[Cloudinary] Delete failed:", err);
        }
    }

    // -----------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------

    /**
     * Wraps a Cloudinary upload in exponential-backoff retry logic.
     * Network blips and transient 5xx responses from Cloudinary are retried
     * automatically without surfacing the failure to the caller.
     *
     * Delay schedule: 500ms -> 1000ms -> 2000ms
     *
     * @throws {StorageUploadError} if all attempts fail.
     */
    private async uploadWithRetry(
        buffer: Buffer,
        options: Record<string, unknown>,
        attempt = 1,
    ): Promise<UploadApiResponse> {
        try {
            return await this.uploadBuffer(buffer, options);
        } catch (err: unknown) {
            if (attempt >= MAX_RETRIES) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Unknown Cloudinary error";
                throw new StorageUploadError(
                    `Cloudinary upload failed after ${MAX_RETRIES} attempts: ${message}`,
                );
            }

            const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
            console.warn(
                `[Cloudinary] Upload attempt ${attempt} failed. Retrying in ${delayMs}ms...`,
            );
            await this.sleep(delayMs);
            return this.uploadWithRetry(buffer, options, attempt + 1);
        }
    }

    /**
     * Wraps Cloudinary's callback-based upload_stream in a Promise.
     * Pipes the buffer through a writable stream to the Cloudinary API.
     */
    private uploadBuffer(
        buffer: Buffer,
        options: Record<string, unknown>,
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                options as unknown as Parameters<
                    typeof cloudinary.uploader.upload_stream
                >[0],
                (error, result) => {
                    if (error || !result) {
                        reject(error ?? new Error("No result from Cloudinary"));
                    } else {
                        resolve(result);
                    }
                },
            );
            stream.end(buffer);
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
