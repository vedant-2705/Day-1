export interface CreateRefreshTokenDTO {
    userId: string;
    tokenHash: string;
    deviceInfo?: string | null;
    ipAddress: string | null;
    expiresAt: Date;
}