export interface Editor {
    _id: string;           // Editor document ID
    userId: string;        // Reference to user
    
    // User information
    fullname: string;      // From User
    username: string;      // From User
    email: string;         // From User
    profileImage?: string; // From User
    
    // Editor-specific information
    category?: string[];   // Editor categories/specialties
    score?: number;        // Overall editor score
    ratingsCount?: number; // Number of ratings received
    averageRating?: number; // Average rating value
    
    // Status information
    createdAt: string;     // When they became an editor
    isVerified: boolean;   // From User
    isBlocked: boolean;    // From User
    
    // Optional additional information
    socialLinks?: {
        linkedIn?: string;
        pinterest?: string;
        instagram?: string;
        facebook?: string;
        website?: string;
    };
}