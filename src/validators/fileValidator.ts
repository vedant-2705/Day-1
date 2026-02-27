/**
 * @module fileValidator
 * @description Validates uploaded files by inspecting their magic bytes (file signatures)
 * rather than trusting the file extension or Content-Type header.
 *
 * Why magic bytes matter:
 *   An attacker can rename `malware.exe` to `photo.jpg` and upload it.
 *   The browser sends `image/jpeg` as the MIME type - which is client-controlled.
 *   Magic bytes are the first N bytes of the actual file content, which cannot be
 *   spoofed without corrupting the file itself. This is the only reliable check.
 *
 * Allowed types:
 *   Profile images: JPEG, PNG, GIF, WebP
 *   Documents:      PDF, DOCX, DOC
 */

// -----------------------------------------------------------------------------
// Magic byte signatures
// Each entry maps a MIME type to its expected byte sequences at offset 0.
// Some formats (ZIP-based like DOCX) require deeper inspection.
// -----------------------------------------------------------------------------

interface MagicSignature {
    /** Byte offset from the start of the file where the signature appears. */
    offset: number;
    /** Expected byte sequence at the given offset. */
    bytes: number[];
}

interface AllowedType {
    mimeType: string;
    signatures: MagicSignature[];
}

export const IMAGE_TYPES = {
    JPEG: "image/jpeg",
    PNG: "image/png",
    GIF: "image/gif",
    WEBP: "image/webp",
}

export const ALLOWED_IMAGE_TYPES: AllowedType[] = [
    {
        mimeType: IMAGE_TYPES.JPEG,
        signatures: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
    },
    {
        mimeType: IMAGE_TYPES.PNG,
        signatures: [
            {
                offset: 0,
                bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
            },
        ],
    },
    {
        mimeType: IMAGE_TYPES.GIF,
        signatures: [
            { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
            { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
        ],
    },
    {
        mimeType: IMAGE_TYPES.WEBP,
        // WebP: "RIFF" at 0, "WEBP" at 8
        signatures: [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }],
    },
];

export const DOCUMENT_TYPES = {
    PDF: "application/pdf",
    DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    DOC: "application/msword",
}

export const ALLOWED_DOCUMENT_TYPES: AllowedType[] = [
    {
        mimeType: DOCUMENT_TYPES.PDF,
        signatures: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
    },
    {
        // DOCX is a ZIP file containing XML - magic bytes are PK (ZIP header)
        // We accept both DOCX and DOC MIME types that start with PK
        mimeType:
            DOCUMENT_TYPES.DOCX,
        signatures: [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }], // PK\x03\x04
    },
    {
        // Legacy .doc (OLE2 Compound Document)
        mimeType: DOCUMENT_TYPES.DOC,
        signatures: [
            {
                offset: 0,
                bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
            },
        ],
    },
];

export type FileCategory = "image" | "document";

export interface ValidationResult {
    valid: boolean;
    /** Resolved MIME type from magic bytes - use THIS, not the client-supplied type. */
    mimeType?: string;
    error?: string;
}

/**
 * Validates a file buffer by checking its magic bytes against the allowed list
 * for the given category.
 *
 * @param buffer   - Raw file bytes from Multer memoryStorage.
 * @param category - Whether to validate against image or document rules.
 * @returns        {@link ValidationResult} with the confirmed MIME type or an error message.
 */
export function validateFileBytes(
    buffer: Buffer,
    category: FileCategory,
): ValidationResult {
    const allowedTypes =
        category === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;

    for (const type of allowedTypes) {
        for (const sig of type.signatures) {
            if (matchesSignature(buffer, sig)) {
                // Extra check for WebP: bytes 8-11 must be "WEBP"
                if (type.mimeType === "image/webp") {
                    const webpMarker = buffer.subarray(8, 12).toString("ascii");
                    if (webpMarker !== "WEBP") continue;
                }
                return { valid: true, mimeType: type.mimeType };
            }
        }
    }

    const allowed =
        category === "image" ? "JPEG, PNG, GIF, WebP" : "PDF, DOCX, DOC";

    return {
        valid: false,
        error: `Invalid file type. Allowed ${category} formats: ${allowed}`,
    };
}

/**
 * Checks whether a buffer's bytes at the specified offset match the expected signature.
 */
function matchesSignature(buffer: Buffer, sig: MagicSignature): boolean {
    if (buffer.length < sig.offset + sig.bytes.length) return false;
    return sig.bytes.every((byte, i) => buffer[sig.offset + i] === byte);
}

/**
 * Returns the allowed MIME type strings for a given category.
 * Used by Multer's fileFilter to do a preliminary MIME check before
 * the buffer is fully in memory (secondary magic-byte check happens after).
 */
export function getAllowedMimeTypes(category: FileCategory): string[] {
    const types =
        category === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
    return types.map((t) => t.mimeType);
}
