import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'obras',
    loadComponent: () =>
      import('./features/projects/project-list/project-list.component').then(
        (m) => m.ProjectListComponent
      ),
  },
  {
    path: 'obras/:id',
    loadComponent: () =>
      import(
        './features/projects/project-detail/project-detail.component'
      ).then((m) => m.ProjectDetailComponent),
  },
  {
    path: 'catalogo-materiales',
    loadComponent: () =>
      import(
        './features/catalog/material-catalog-list/material-catalog-list.component'
      ).then((m) => m.MaterialCatalogListComponent),
  },
  {
    path: 'catalogo-mano-obra',
    loadComponent: () =>
      import(
        './features/catalog/labor-catalog-list/labor-catalog-list.component'
      ).then((m) => m.LaborCatalogListComponent),
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import(
        './features/categories/categories-manager/categories-manager.component'
      ).then((m) => m.CategoriesManagerComponent),
  },
  {
    path: 'unidades',
    loadComponent: () =>
      import('./features/units/units-manager/units-manager.component').then(
        (m) => m.UnitsManagerComponent
      ),
  },
  {
    path: 'inventario',
    loadComponent: () =>
      import(
        './features/inventory/inventory-manager/inventory-manager.component'
      ).then((m) => m.InventoryManagerComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
