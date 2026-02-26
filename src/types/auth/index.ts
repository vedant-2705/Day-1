import { UserDTO } from "dto/UserDTO.js";

export interface TokenPair {
    accessToken: string; // JWT - short lived, sent in response body
    refreshToken: string; // opaque random - sent as HttpOnly cookie
}

export interface AuthResult {
    user: UserDTO;
    accessToken: string;
    refreshToken: string;
}

export interface RequestContext {
    ip: string | null;
    userAgent: string | null;
}
