import { AppError } from "./AppError.js";

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, "VALIDATION_ERROR", details);
    }
}
