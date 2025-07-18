import { Routes } from '@angular/router';
import { TabsComponent } from './tabs/tabs.component';

export const routes: Routes = [
  {
    path: '',
    component: TabsComponent,
    children: [
      {
        path: 'holding',
        loadComponent: () =>
          import('./pages/holding/holding.component').then(m => m.HoldingComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      // {
      //   path: 'setting',
      //   loadComponent: () =>
      //     import('./pages/settings/settings.component').then(m => m.SettingsComponent),
      // },
      {
        path: '',
        redirectTo: 'holding',
        pathMatch: 'full',
      },
    ],
  },
];
