import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./auth/register').then(m => m.Register) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    children: [
      { path: '', loadComponent: () => import('./pages/overview').then(m => m.Overview) },
      { path: 'events/new', canActivate: [adminGuard], loadComponent: () => import('./events/event-wizard').then(m => m.EventWizard) },
      { path: 'events', loadComponent: () => import('./pages/events').then(m => m.EventsPage) },
      { path: 'tickets', loadComponent: () => import('./pages/tickets').then(m => m.TicketsPage) },
      { path: 'clubs', loadComponent: () => import('./pages/clubs').then(m => m.ClubsPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings').then(m => m.SettingsPage) },
    ]
  },
  { path: 'events', redirectTo: 'dashboard/events', pathMatch: 'full' },
  { path: 'tickets', redirectTo: 'dashboard/tickets', pathMatch: 'full' },
  { path: 'clubs', redirectTo: 'dashboard/clubs', pathMatch: 'full' },
  { path: 'settings', redirectTo: 'dashboard/settings', pathMatch: 'full' },
  { path: 'events/new', redirectTo: 'dashboard/events/new', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
