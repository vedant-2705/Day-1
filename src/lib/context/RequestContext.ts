import { AsyncLocalStorage } from "async_hooks";

export interface RequestContextStore {
    userId: string; // authenticated user id, or 'system'
    ip: string | null;
    userAgent: string | null;
    requestId: string; // trace id - useful for correlating logs with audit entries
}

// Single instance - shared across the entire app
// Each request gets its own isolated store via .run()
export const RequestContext = new AsyncLocalStorage<RequestContextStore>();
