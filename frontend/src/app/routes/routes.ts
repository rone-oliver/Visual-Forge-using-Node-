export const AUTH_ROUTES = {
    LOGIN: () => import('../Pages/User/login/login.component').then(m => m.LoginComponent),
    REGISTER: () => import('../components/user/user-register/user-register.component').then(m => m.UserRegisterComponent),
    ADMIN_LOGIN: () => import('../Pages/Admin/login/login.component').then(m => m.LoginComponent),
}

export const USER_ROUTES = {
    HOME: () => import('../components/user/home/home.component').then(m => m.HomeComponent),
    QUOTATIONS: () => import('../components/user/quotation/quotation.component').then(m => m.QuotationComponent),
    CREATE_QUOTATION: () => import('../components/user/create-quotation/create-quotation.component').then(m => m.CreateQuotationComponent),
    PUBLIC_WORKS: () => import('../components/user/public-works/public-works.component').then(m => m.PublicWorksComponent),
    CHAT: () => import('../components/user/chat/chat.component').then(m => m.ChatComponent),
    EDITOR_LISTING: () => import('../components/user/editor-listing/editor-listing.component').then(m => m.EditorListingComponent),
    EDITOR_PROFILE: () => import('../components/user/editor-profile/editor-profile.component').then(m => m.EditorProfileComponent),
    PROFILE_LAYOUT: () => import('../Layouts/profile-layout/profile-layout.component').then(m => m.ProfileLayoutComponent),
    PROFILE: () => import('../components/user/profile/details/profile.component').then(m => m.ProfileComponent),
    TRANSACTION_HISTORY: () => import('../components/user/profile/transaction-history/transaction-history.component').then(m => m.TransactionHistoryComponent),
    WALLET: () => import('../components/user/profile/wallet/wallet.component').then(m => m.WalletComponent)
}

export const ADMIN_ROUTES = {
    DASHBOARD: () => import('../components/admin/home/home.component').then(m => m.HomeComponent),
    USERS: () => import('../components/admin/user-section/user-section.component').then(m => m.UserSectionComponent),
    EDITORS: () => import('../components/admin/editor-section/editor-section.component').then(m => m.EditorSectionComponent)
};

export const EDITOR_ROUTES = {
    PUBLISHED_QUOTATIONS: () => import('../components/editor/quotation/quotation.component').then(m => m.QuotationComponent),
    ACCEPTED_QUOTATIONS: () => import('../components/editor/accepted-quotation/accepted-quotation.component').then(m => m.AcceptedQuotationComponent),
    WORKS_HISTORY: () => import('../components/editor/works-history/works-history.component').then(m => m.WorksHistoryComponent)
};