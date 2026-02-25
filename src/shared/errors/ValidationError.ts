/**
 * @module ValidationError
 * @description Domain error representing an HTTP 422 Unprocessable Entity.
 * Thrown when a request is syntactically valid but fails semantic validation
 * (e.g. missing required fields, invalid enum values, or constraint violations
 * detected by Zod schema parsing).
 */

import { AppError } from "./AppError.js";

/**
 * Thrown when incoming request data fails schema or business-rule validation.
 * Maps to HTTP 422 Unprocessable Entity.
 *
 * @remarks
 * 422 is preferred over 400 here because the request was well-formed JSON
 * but its content was semantically invalid. Pass the Zod error details in
 * `details` so the client receives actionable, field-level feedback without
 * exposing any internal implementation details.
 *
 * @example
 * throw new ValidationError(z.prettifyError(zodError));
 */
export class ValidationError extends AppError {
    /**
     * @param details - Optional structured validation issues (e.g. Zod prettified error output)
     *                  to include in the `errors` field of the response envelope.
     */
    constructor(
        details?: unknown,
    ) {
        super("VALIDATION_FAILED", {}, details);
    }
}
