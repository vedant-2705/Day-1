import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 409, "CONFLICT", details);
    }
}
