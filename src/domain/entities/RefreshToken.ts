export interface RefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    deviceInfo?: string | null;
    ipAddress?: string | null;
    expiresAt: Date;
    revokedAt?: Date | null;
    createdAt: Date;
}