/**
 * @module IStorageService
 * @description Abstract contract for file storage providers.
 *
 * Implementations:
 *  - CloudinaryStorageService - production; CDN-backed, auto image optimisation
 *  - LocalStorageService      - development fallback; writes to /uploads on disk
 *
 * Keeping the storage concern behind an interface means the use cases,
 * controllers, and the entire application are decoupled from the provider.
 * Swapping Cloudinary -> S3 -> Azure Blob requires only a new implementation
 * of this interface - zero changes to business logic.
 */

import { DeleteOptions, UploadOptions, UploadResult } from "types/storage/index.js";

export interface IStorageService {
    /**
     * Uploads a file buffer to the storage provider.
     *
     * @param buffer  - Raw file bytes (from Multer memoryStorage).
     * @param mimeType - MIME type confirmed by magic-bytes check.
     * @param options  - Folder, filename, and resource type configuration.
     * @returns       {@link UploadResult} with the permanent URL and metadata.
     * @throws        StorageUploadError on provider failure (after retries).
     */
    upload(
        buffer: Buffer,
        mimeType: string,
        options: UploadOptions,
    ): Promise<UploadResult>;

    /**
     * Permanently deletes a previously uploaded asset.
     * Silently no-ops if the asset no longer exists (safe for re-entrant cleanup).
     *
     * @param options - Storage path and resource type of the asset to remove.
     */
    delete(options: DeleteOptions): Promise<void>;
}

/** DI injection token for {@link IStorageService}. */
export const STORAGE_SERVICE = Symbol.for("IStorageService");
