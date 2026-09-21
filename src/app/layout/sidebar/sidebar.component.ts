import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly isMobileOpen = input<boolean>(false);
  readonly closeMobile = output<void>();

  readonly navItems = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      exact: true,
    },
    {
      label: 'Obras y Proyectos',
      subtitle: 'Presupuestos por Obra',
      route: '/obras',
      icon: 'building',
      exact: false,
    },
    {
      label: 'Catálogo de Materiales',
      subtitle: 'Inventario Maestro Global',
      route: '/catalogo-materiales',
      icon: 'catalog',
      exact: false,
    },
    {
      label: 'Catálogo de Mano de Obra',
      subtitle: 'Tarifario Maestro Global',
      route: '/catalogo-mano-obra',
      icon: 'users',
      exact: false,
    },
    {
      label: 'Estructura Maestra',
      subtitle: 'Categorías y Subcategorías',
      route: '/categorias',
      icon: 'layers',
      exact: false,
    },
    {
      label: 'Unidades de Medida & Compra',
      subtitle: 'Métricas técnicas y comerciales',
      route: '/unidades',
      icon: 'ruler',
      exact: false,
    },
    {
      label: 'Inventario de Herramientas',
      subtitle: 'Maquinaria y Locaciones',
      route: '/inventario',
      icon: 'tools',
      exact: false,
    },
  ];

  readonly futureItems = [
    {
      label: 'Gastos Generales',
      subtitle: 'Costos indirectos y fijos',
      icon: 'calculator',
    },
    {
      label: 'Reportes y Exportación',
      subtitle: 'Exportación a Excel / PDF',
      icon: 'chart',
    },
  ];
}
