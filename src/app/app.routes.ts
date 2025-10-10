import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'menu-principal',
    loadComponent: () => import('./menu-principal/menu-principal.page').then( m => m.MenuPrincipalPage),
    canActivate: [authGuard]
  },
  {
    path: 'despensa',
    loadComponent: () => import('./despensa/despensa.page').then( m => m.DespensaPage)
  },
  {
    path: 'recetas',
    loadComponent: () => import('./recetas/recetas.page').then( m => m.RecetasPage)
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./configuracion/configuracion.page').then( m => m.ConfiguracionPage)
  },
];
