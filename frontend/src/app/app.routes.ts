import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './Layouts/admin-layout/admin-layout.component';
import { UserLayoutComponent } from './Layouts/user-layout/user-layout.component';
import { LandingPageComponent } from './Pages/User/landing-page/landing-page.component';
import { UserRegisterComponent } from './components/user/user-register/user-register.component';
import { LoginComponent } from './Pages/User/login/login.component';
import { LoginComponent as AdminLoginComponent } from './Pages/Admin/login/login.component';
import { AuthLayoutComponent } from './Layouts/auth-layout/auth-layout.component';
import { userGuard, adminGuard, userLoginGuard, adminLoginGuard, editorGuard } from './guards/auth.guard';
import { HomeComponent as UserHomeComponent } from './components/user/home/home.component';
import { HomeComponent as AdminHomeComponent } from './components/admin/home/home.component';
import { UserSectionComponent } from './components/admin/user-section/user-section.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { EditorSectionComponent } from './components/admin/editor-section/editor-section.component';
import { QuotationComponent as UserQuotationComponent } from './components/user/quotation/quotation.component';
import { CreateQuotationComponent } from './components/user/create-quotation/create-quotation.component';
import { QuotationComponent as EditorQuotationComponent } from './components/editor/quotation/quotation.component';
import { AcceptedQuotationComponent } from './components/editor/accepted-quotation/accepted-quotation.component';
import { WorksHistoryComponent } from './components/editor/works-history/works-history.component';
import { PublicWorksComponent } from './components/user/public-works/public-works.component';

export const routes: Routes = [
    {
        path:'', component: LandingPageComponent,
        canActivate:[userLoginGuard]
    },
    {
        path:'auth',component: AuthLayoutComponent,
        children: [
            {
                path: 'login', component: LoginComponent, canActivate:[userLoginGuard]
            },
            {
                path: 'register', component: UserRegisterComponent
            },
            {
                path: 'admin/login', component: AdminLoginComponent, canActivate:[adminLoginGuard]
            }
        ]
    },
    {
        path:'admin', component: AdminLayoutComponent,
        canActivate: [adminGuard],
        canActivateChild: [adminGuard],
        children: [
            {
                path:'dashboard', component: AdminHomeComponent,
            },
            {
                path:'users', component: UserSectionComponent,
            },
            {
                path:'editors', component: EditorSectionComponent,
            }
        ]
    },
    {
        path:'user', component: UserLayoutComponent,
        canActivate: [userGuard],
        canActivateChild: [userGuard],
        children: [
            {
                path:'', component: UserHomeComponent,
            },
            {
                path:'profile', component: ProfileComponent
            },
            {
                path:'quotations', component: UserQuotationComponent
            },
            {
                path:'create-quotation', component: CreateQuotationComponent
            },
            {
                path:'works', component: PublicWorksComponent
            }
        ]
    },
    {
        path: 'editor', component: UserLayoutComponent,
        canActivate: [editorGuard],
        canActivateChild: [editorGuard],
        children: [
            {
                path:'published-quotations',component: EditorQuotationComponent
            },
            {
                path:'accepted-quotations', component: AcceptedQuotationComponent
            },
            {
                path:'works/history', component: WorksHistoryComponent
            }
        ]
    }
];
