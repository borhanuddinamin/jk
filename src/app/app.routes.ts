import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';
import { LandingComponent } from './views/landing/landing.component';

export const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'landing',
  //   pathMatch: 'full'
  // },
   {
    path: '',
    component: LandingComponent,
    data: {
      title: 'Home'
    },
   },   
  {
    path: '',
    component: DefaultLayoutComponent,
    
    children: [
      {
        path: 'password-reset',
        loadComponent: () => import('./views/password-reset/password-reset.component')
          .then(m => m.PasswordResetComponent),
        data: {
          title: 'Password Reset'
        }
      },
      {
        path: 'Installment',
        loadComponent: () => import('./views/Installment/installment.component')
          .then(m => m.InstallmentComponent),
        data: {
          title: 'Installment'
        }
      },
      {
        path: 'Products',
        loadComponent: () => import('./views/product-View/product-view.component')
          .then(m => m.ProductViewComponent),
        data: {
          title: 'Products'
        }
      },
      {
        path: 'associate',
        loadComponent: () => import('./views/employee-management/employee-management.component')
          .then(m => m.EmployeeManagementComponent),
        data: {
          title: 'Employee Management'
        }
      },
      {
        path: 'user-management',
        loadComponent: () => import('./views/user-managment/user-managment.component')
          .then(c => c.UserManagmentComponent),
        data: {
          title: 'User Management'
        }
      },
      {
        path: 'sales',
        loadComponent: () => import('./views/sales-product/sales-product.component')
          .then(c => c.SalesProductComponent),
        data: {
          title: 'Sales Management'
        }
      },
      {
        path: 'chart-of-accounts',
        loadComponent: () => import('./views/chart-of-accounts/chart-of-accounts.component')
          .then(c => c.ChartOfAccountsComponent),
        data: {
          title: 'chart-of-accounts'
        }
      },
      {
        path: 'voucher-entry',
        loadComponent: () => import('./views/voucher-entry/voucher-entry.component')
          .then(c => c.VoucherEntryComponent),
        data: {
          title: 'voucher-entry'
        }
      },
      {
        path: 'product',
        loadComponent: () => import('./views/add-product/add-product.component')
          .then(m => m.AddProductComponent)
      },
      {
        path: 'ExecutiveAssociate',
        loadComponent: () => import('./views/suppliers/suppliers.component')
          .then(m => m.SuppliersComponent)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes)
      },
      // {
      //   path: 'employee',
      //   loadChildren: () => import('./views/employee-management/employee-management.component').then((m) => m.EmployeeManagementComponent)
      // },
      // {
      //   path: 'theme',
      //   loadChildren: () => import('./views/theme/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'base',
      //   loadChildren: () => import('./views/base/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'buttons',
      //   loadChildren: () => import('./views/buttons/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'forms',
      //   loadChildren: () => import('./views/forms/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'icons',
      //   loadChildren: () => import('./views/icons/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'notifications',
      //   loadChildren: () => import('./views/notifications/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'widgets',
      //   loadChildren: () => import('./views/widgets/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'charts',
      //   loadChildren: () => import('./views/charts/routes').then((m) => m.routes)
      // },
      // {
      //   path: 'pages',
      //   loadChildren: () => import('./views/pages/routes').then((m) => m.routes)
      // }
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login Page'
    }
  },
  // {
  //   path: 'register',
  //   loadComponent: () => import('./views/pages/register/register.component').then(m => m.RegisterComponent),
  //   data: {
  //     title: 'Register Page'
  //   }
  // },
  //{ path: '**', redirectTo: 'dashboard' }
];
