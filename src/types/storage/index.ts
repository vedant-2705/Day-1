export type ResourceType = "image" | "document"; 

export interface UploadResult {
    /** Provider-assigned storage key. Cloudinary: public_id. Local: relative path. */
    storagePath: string;
    /** Fully-qualified public URL served by CDN or local server. */
    publicUrl: string;
    /** MIME type confirmed after upload (as echoed by Cloudinary or detected locally). */
    mimeType: string;
    /** Final file size in bytes (post-transform for Cloudinary). */
    sizeBytes: number;
    /** Width in pixels - only populated for image uploads. */
    width?: number;
    /** Height in pixels - only populated for image uploads. */
    height?: number;
}

export interface UploadOptions {
    /**
     * Target folder path within the storage provider.
     * Convention: `{env}/crm-lite/{userId}/{type}/`
     * e.g. `production/crm-lite/clxyz123/profile/`
     */
    folder: string;
    /**
     * Generated filename (without extension).
     * Convention: `{unixMs}-{nanoid8}`
     * Extension is appended by the provider based on output format.
     */
    fileName: string;
    /** Upload category - drives Cloudinary resource_type and transformation preset. */
    resourceType: ResourceType;
}

export interface DeleteOptions {
    /** The storagePath (public_id / relative path) returned from a previous upload. */
    storagePath: string;
    resourceType: ResourceType;
}