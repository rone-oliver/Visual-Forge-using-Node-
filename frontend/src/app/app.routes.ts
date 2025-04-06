import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './Layouts/admin-layout/admin-layout.component';
import { UserLayoutComponent } from './Layouts/user-layout/user-layout.component';
import { LandingPageComponent } from './Pages/User/landing-page/landing-page.component';
import { UserRegisterComponent } from './components/user/user-register/user-register.component';
import { LoginComponent } from './Pages/User/login/login.component';
import { LoginComponent as AdminLoginComponent } from './Pages/Admin/login/login.component';
import { AuthLayoutComponent } from './Layouts/auth-layout/auth-layout.component';
import { userGuard, adminGuard, userLoginGuard, adminLoginGuard } from './guards/auth.guard';
import { HomeComponent as UserHomeComponent } from './components/user/home/home.component';
import { HomeComponent as AdminHomeComponent } from './components/admin/home/home.component';
import { UserSectionComponent } from './components/admin/user-section/user-section.component';

export const routes: Routes = [
    {
        path:'', component: LandingPageComponent
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
        ]
    }
];
