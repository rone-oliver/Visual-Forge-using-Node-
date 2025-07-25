export interface JwtPayload {
    userId: string;
    email: string;
    role: 'User' | 'Editor' | 'Admin';

    // Editor-specific fields
    isSuspended?: boolean;
    suspendedUntil?: Date;
    warningCount?: number;

    // Standard JWT fields
    iat?: number;
    exp?: number;
}