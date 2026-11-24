import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  readonly projectService = inject(ProjectService);
  readonly isMobileOpen = input<boolean>(false);
  readonly closeMobile = output<void>();

  ngOnInit(): void {
    if (this.projectService.projects().length === 0) {
      this.projectService.loadProjects({ page_size: 5 }).subscribe();
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'budget':
        return 'En Presupuesto';
      case 'paused':
        return 'Pausada';
      case 'completed':
        return 'Finalizada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status || 'Activa';
    }
  }

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
      label: 'Directorio de Proveedores',
      subtitle: 'Materiales & Contratistas',
      route: '/proveedores',
      icon: 'supplier',
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
      subtitle: 'Categorías, Subcategorías y Etapas',
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
  ];

  readonly futureItems = [
    {
      label: 'Seguridad & Roles (IAM)',
      subtitle: 'Permisos dinámicos por cargo',
      icon: 'users',
    },
    {
      label: 'Gastos Reales & Caja Chica',
      subtitle: 'Ejecución, cuotas y rendiciones',
      icon: 'calculator',
    },
    {
      label: 'Varianza & Herramientas',
      subtitle: 'Análisis de desvíos y activos',
      icon: 'chart',
    },
  ];
}
