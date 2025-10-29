import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'menu-principal',
    loadComponent: () => import('./pages/menu-principal/menu-principal.page').then( m => m.MenuPrincipalPage)
  },
  {
    path: 'lista',
    loadComponent: () => import('./pages/despensa/lista/lista.page').then( m => m.ListaPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/despensa/registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'editar',
    loadComponent: () => import('./pages/despensa/editar/editar.page').then( m => m.EditarPage)
  },
  {
    path: 'recetas',
    loadComponent: () => import('./pages/recetas/recetas.page').then( m => m.RecetasPage)
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./pages/configuracion/configuracion.page').then( m => m.ConfiguracionPage)
  },
  {
  path: 'lista-compras',
  loadComponent: () => import('./pages/lista-compras/lista-compras.page').then(m => m.ListaComprasPage)
},



];
