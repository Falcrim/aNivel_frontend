import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly toggleMobileSidebar = output<void>();

  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly breadcrumbs = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/obras')) {
      if (url.includes('/obras/')) {
        return {
          title: 'Detalle de Obra y Presupuestos',
          section: 'Obras y Proyectos',
        };
      }
      return {
        title: 'Obras y Proyectos',
        section: 'Gestión Principal',
      };
    } else if (url.startsWith('/catalogo-materiales')) {
      return {
        title: 'Catálogo Maestro de Materiales',
        section: 'Inventario Global',
      };
    } else if (url.startsWith('/categorias')) {
      return {
        title: 'Estructura Maestra',
        section: 'Categorías & Subcategorías',
      };
    } else if (url.startsWith('/unidades')) {
      return {
        title: 'Unidades de Medida y Compra',
        section: 'Configuración Técnica',
      };
    }
    return {
      title: 'Dashboard General',
      section: 'Panel de Control',
    };
  });

  readonly currentTitle = computed(() => this.breadcrumbs().title);
  readonly currentSection = computed(() => this.breadcrumbs().section);
}
