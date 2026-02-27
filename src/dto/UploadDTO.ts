/**
 * @module UploadDTO
 * @description Data Transfer Objects for file upload operations.
 * Covers both profile picture updates (stored on User) and document uploads (own table).
 */

// ---------------------------------------------------------
// Document DTOs
// ---------------------------------------------------------

/**
 * Input shape for creating a Document record after a successful storage upload.
 * Constructed by the use case from UploadResult + request context.
 */
export interface CreateDocumentDTO {
    userId: string;
    /** Original filename as sent by the client - stored for display only. */
    fileName: string;
    /** Provider storage key (Cloudinary public_id or local relative path). */
    storagePath: string;
    /** Fully-qualified public URL. */
    publicUrl: string;
    /** MIME type confirmed by magic-bytes validation. */
    mimeType: string;
    /** File size in bytes. */
    sizeBytes: number;
}

/**
 * Safe public representation of a Document record.
 * Returned in API responses - does not expose internal storage keys.
 */
export interface DocumentDTO {
    id: string;
    userId: string;
    fileName: string;
    publicUrl: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: Date;
}

// ---------------------------------------------------------
// Profile picture DTOs
// ---------------------------------------------------------

/**
 * Result returned after a successful profile picture upload.
 */
export interface ProfilePictureDTO {
    /** New CDN URL for the uploaded profile picture. */
    profilePicture: string;
    /** Width of the stored image in pixels (post-transform). */
    width?: number;
    /** Height of the stored image in pixels (post-transform). */
    height?: number;
}
