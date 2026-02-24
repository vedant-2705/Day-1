/**
 * @module ValidationMiddleware
 * @description Express middleware factory for validating request data with Zod schemas.
 * On failure, passes the ZodError to the global error handler (422).
 * On success, replaces the raw request data with the Zod-parsed (and coerced) output.
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/** Standard request parts that can be validated */
type RequestPart = "body" | "params" | "query";

/**
 * Returns a middleware that validates `req[part]` against the given Zod schema.
 * Replaces the request data with the parsed output so downstream handlers receive
 * clean, type-safe, coerced values (e.g. trimmed strings, lowercased email).
 *
 * @param schema - Zod schema to validate against
 * @param part   - Which part of the request to validate. Defaults to `"body"`
 * @returns Express middleware function
 */
export function validate(schema: ZodSchema, part: RequestPart = "body") {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[part]);

        if (!result.success) {
            next(result.error);
            return;
        }

        // Replace raw input with Zod-parsed output to apply transformations (trim, toLowerCase, etc.)
        req[part] = result.data;
        next();
    };
}
