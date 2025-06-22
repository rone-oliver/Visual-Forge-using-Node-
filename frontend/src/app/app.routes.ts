import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './Layouts/admin-layout/admin-layout.component';
import { UserLayoutComponent } from './Layouts/user-layout/user-layout.component';
import { LandingPageComponent } from './Pages/User/landing-page/landing-page.component';
import { AuthLayoutComponent } from './Layouts/auth-layout/auth-layout.component';
import { userGuard, adminGuard, userLoginGuard, adminLoginGuard, editorGuard } from './guards/auth.guard';
import { AUTH_ROUTES, USER_ROUTES, ADMIN_ROUTES, EDITOR_ROUTES } from './routes/routes';

export const routes: Routes = [
    {
        path:'', component: LandingPageComponent,
        canActivate:[userLoginGuard]
    },
    {
        path:'auth',component: AuthLayoutComponent,
        children: [
            {
                path: 'login', 
                loadComponent: AUTH_ROUTES.LOGIN,
                canActivate: [userLoginGuard]
            },
            {
                path: 'register',
                loadComponent: AUTH_ROUTES.REGISTER
            },
            {
                path: 'admin/login',
                loadComponent: AUTH_ROUTES.ADMIN_LOGIN,
                canActivate: [adminLoginGuard]
            }
        ]
    },
    {
        path:'admin', component: AdminLayoutComponent,
        canActivate: [adminGuard],
        canActivateChild: [adminGuard],
        children: [
            {
                path:'dashboard', 
                loadComponent: ADMIN_ROUTES.DASHBOARD
            },
            {
                path:'users', 
                loadComponent: ADMIN_ROUTES.USERS
            },
            {
                path:'editors', 
                loadComponent: ADMIN_ROUTES.EDITORS
            },
            {
                path:'reports', 
                loadComponent: ADMIN_ROUTES.REPORTS
            }
        ]
    },
    {
        path:'user', component: UserLayoutComponent,
        canActivate: [userGuard],
        canActivateChild: [userGuard],
        children: [
            {
                path:'', 
                loadComponent: USER_ROUTES.HOME
            },
            {
                path:'profile', 
                loadComponent: USER_ROUTES.PROFILE_LAYOUT,
                children:[
                    {
                        path: '',
                        loadComponent: USER_ROUTES.PROFILE
                    },
                    {
                        path: 'transactions',
                        loadComponent: USER_ROUTES.TRANSACTION_HISTORY
                    },
                    {
                        path: 'wallet',
                        loadComponent: USER_ROUTES.WALLET
                    },
                    // {
                    //     path: 'notifications',
                    //     loadComponent: USER_ROUTES.NOTIFICATIONS
                    // },
                    // {
                    //     path: 'settings',
                    //     loadComponent: USER_ROUTES.SETTINGS
                    // },
                ]
            },
            {
                path:'quotations', 
                loadComponent: USER_ROUTES.QUOTATIONS
            },
            {
                path:'create-quotation', 
                loadComponent: USER_ROUTES.CREATE_QUOTATION
            },
            {
                path:'edit-quotation/:id', 
                loadComponent: USER_ROUTES.CREATE_QUOTATION
            },
            {
                path:'works', 
                loadComponent: USER_ROUTES.PUBLIC_WORKS
            },
            {
                path:'messaging', 
                loadComponent: USER_ROUTES.CHAT
            },
            {
                path:'editors',
                loadComponent: USER_ROUTES.EDITOR_LISTING
            },
            {
                path: 'editors/profile/:id',
                loadComponent: USER_ROUTES.EDITOR_PROFILE
            },
        ]
    },
    {
        path: 'editor', component: UserLayoutComponent,
        canActivate: [editorGuard],
        canActivateChild: [editorGuard],
        children: [
            {
                path:'published-quotations',
                loadComponent: EDITOR_ROUTES.PUBLISHED_QUOTATIONS
            },
            {
                path:'accepted-quotations', 
                loadComponent: EDITOR_ROUTES.ACCEPTED_QUOTATIONS
            },
            {
                path:'works/history', 
                loadComponent: EDITOR_ROUTES.WORKS_HISTORY
            },
            {
                path: 'community/:id',
                loadComponent: EDITOR_ROUTES.COMMUNITY_CHAT
            },
            {
                path: 'community',
                loadComponent: EDITOR_ROUTES.COMMUNITIES
            }
        ]
    }
];
