import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', data: { title: 'Login' }, loadComponent: () => import('./auth/login').then(m => m.Login) },
  { path: 'register', data: { title: 'Register' }, loadComponent: () => import('./auth/register').then(m => m.Register) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    children: [
      { path: '', data: { title: 'Dashboard' }, loadComponent: () => import('./pages/overview').then(m => m.Overview) },
      { path: 'events/new', data: { title: 'Create Event' }, canActivate: [adminGuard], loadComponent: () => import('./events/event-wizard').then(m => m.EventWizard) },
      { path: 'events', data: { title: 'Discover Events' }, loadComponent: () => import('./pages/events').then(m => m.EventsPage) },
      { path: 'tickets', data: { title: 'My Tickets' }, loadComponent: () => import('./pages/tickets').then(m => m.TicketsPage) },
      { path: 'clubs', data: { title: 'Clubs' }, loadComponent: () => import('./pages/clubs').then(m => m.ClubsPage) },
      { path: 'settings', data: { title: 'Settings' }, loadComponent: () => import('./pages/settings').then(m => m.SettingsPage) },
    ]
  },
  { path: 'events', redirectTo: 'dashboard/events', pathMatch: 'full' },
  { path: 'tickets', redirectTo: 'dashboard/tickets', pathMatch: 'full' },
  { path: 'clubs', redirectTo: 'dashboard/clubs', pathMatch: 'full' },
  { path: 'settings', redirectTo: 'dashboard/settings', pathMatch: 'full' },
  { path: 'events/new', redirectTo: 'dashboard/events/new', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
