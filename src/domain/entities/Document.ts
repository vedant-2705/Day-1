/**
 * @module Document
 * @description Domain entity representing an uploaded document (PDF / DOCX).
 * Maps directly to the `documents` table. Profile pictures are NOT stored
 * here - they live as a nullable URL field on the User entity.
 */
export interface Document {
    /** Unique document identifier (CUID). */
    id: string;
    /** ID of the user who uploaded this document. */
    userId: string;
    /** Original filename as uploaded - for display purposes only. */
    fileName: string;
    /** Provider-assigned storage key (Cloudinary public_id or local path). */
    storagePath: string;
    /** Fully-qualified public CDN / server URL. */
    publicUrl: string;
    /** MIME type confirmed by magic-bytes validation at upload time. */
    mimeType: string;
    /** File size in bytes. */
    sizeBytes: number;
    /** Timestamp when the document was uploaded. */
    uploadedAt: Date;
}
