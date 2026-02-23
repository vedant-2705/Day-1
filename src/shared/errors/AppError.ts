export class AppError extends Error {
    constructor(
        public readonly message: string,
        public readonly statusCode: number = 500,
        public readonly errorCode?: string,
        public readonly details?: any,
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: {
                name: this.name,
                message: this.message,
                statusCode: this.statusCode,
                errorCode: this.errorCode,
                details: this.details,
            },
        };
    }
}