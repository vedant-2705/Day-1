import { ErrorCode } from 'constants/ErrorCodes.js';
import { AppError }  from './AppError.js';

export class UnauthorizedError extends AppError {
    constructor(code: ErrorCode) {
        super(code);
    }
}