import { Role } from "../enums/role.enum";

export interface JwtPayload {
    userId: string;
    email?: string;
    username?: string;
    role: Role;

    // Editor-specific fields
    isSuspended?: boolean;
    suspendedUntil?: Date;
    warningCount?: number;

    // Standard JWT fields
    iat?: number;
    exp?: number;
}