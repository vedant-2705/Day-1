export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

export function successResponse<T>(
    data: T,
    meta?: Record<string, unknown>,
): ApiResponse<T> {
    return {
        success: true,
        data,
        meta: { 
            timestamp: new Date().toISOString(), 
            ...meta 
        },
    };
}

export function errorResponse(
    code: string,
    message: string,
    details?: unknown,
): ApiResponse<never> {
    return {
        success: false,
        error: { 
            code, 
            message, 
            ...(details !== undefined && { details }) 
        },
        meta: { timestamp: new Date().toISOString() },
    };
}
