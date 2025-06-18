export interface ReportedUser {
    _id: string;
    username: string;
    email: string;
    isBlocked: boolean;
}

export interface Reporter {
    _id: string;
    username: string;
    email: string;
}

export enum ReportStatus {
    PENDING = 'Pending',
    REVIEWED = 'Reviewed',
    RESOLVED = 'Resolved',
}

export interface Report {
    _id: string;
    reporterId: Reporter;
    reportedUserId: ReportedUser;
    context: 'chat' | 'quotation';
    reason: string;
    additionalContext?: string;
    status: ReportStatus;
    resolution?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateReportPayload {
    status: ReportStatus;
    resolution?: string;
}