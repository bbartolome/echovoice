import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { PersistenceService } from './services/persistence.service';

function pinGuard(): boolean {
  const svc = inject(PersistenceService);
  const router = inject(Router);
  const { pinEnabled } = svc.state().settings;
  if (!pinEnabled) return true;
  const unlocked = sessionStorage.getItem('ev-pin-unlocked') === '1';
  if (!unlocked) {
    router.navigate(['/pin']);
    return false;
  }
  return true;
}

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-shell/admin-shell').then(m => m.AdminShellComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./components/admin-home/admin-home').then(m => m.AdminHomeComponent),
        canActivate: [pinGuard],
      },
      {
        path: 'input',
        loadComponent: () =>
          import('./components/admin-input/admin-input').then(m => m.AdminInputComponent),
        canActivate: [pinGuard],
      },
      {
        path: 'toggles',
        loadComponent: () =>
          import('./components/admin-toggles/admin-toggles').then(m => m.AdminTogglesComponent),
        canActivate: [pinGuard],
      },
      {
        path: 'vocab',
        loadComponent: () =>
          import('./components/coming-soon/coming-soon').then(m => m.ComingSoonComponent),
        canActivate: [pinGuard],
        data: { title: 'Personal vocabulary & context' },
      },
      {
        path: 'phrases',
        loadComponent: () =>
          import('./components/admin-phrases/admin-phrases').then(m => m.AdminPhrasesComponent),
        canActivate: [pinGuard],
      },
      {
        path: 'needs',
        loadComponent: () =>
          import('./components/admin-needs/admin-needs').then(m => m.AdminNeedsComponent),
        canActivate: [pinGuard],
      },
      {
        path: 'llm',
        loadComponent: () =>
          import('./components/coming-soon/coming-soon').then(m => m.ComingSoonComponent),
        canActivate: [pinGuard],
        data: { title: 'Smart predictions' },
      },
      {
        path: 'backup',
        loadComponent: () =>
          import('./components/coming-soon/coming-soon').then(m => m.ComingSoonComponent),
        canActivate: [pinGuard],
        data: { title: 'Backup & sharing' },
      },
    ],
  },
  {
    path: 'pin',
    loadComponent: () =>
      import('./components/admin-pin/admin-pin').then(m => m.AdminPinComponent),
  },
  { path: '**', redirectTo: 'home' },
];
