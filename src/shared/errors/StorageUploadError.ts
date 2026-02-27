/**
 * @module StorageUploadError
 * @description Typed error thrown when a storage provider upload fails
 * after all retry attempts are exhausted.
 * Maps to HTTP 502 Bad Gateway - the upstream storage provider is at fault.
 */
import { ErrorKeys } from "constants/ErrorCodes.js";
import { AppError } from "./AppError.js";

export class StorageUploadError extends AppError {
    constructor(message: string) {
        // Use INTERNAL_SERVER_ERROR as the base - we add the provider message for logging
        super(ErrorKeys.INTERNAL_SERVER_ERROR, {}, undefined, true);
        // Override the message to include provider-specific context for logs
        Object.defineProperty(this, "message", { value: message });
    }
}
