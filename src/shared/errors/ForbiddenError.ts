import { ErrorCode } from 'constants/ErrorCodes.js';
import { AppError }  from './AppError.js';

export class ForbiddenError extends AppError {
    constructor(code: ErrorCode) {
        super(code);
    }
}