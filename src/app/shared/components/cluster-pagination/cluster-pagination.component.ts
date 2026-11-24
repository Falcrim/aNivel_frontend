import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Componente reutilizable de paginación aislada por cluster / subcategoría.
 * Muestra el rango de elementos visibles, botones de navegación anterior/siguiente
 * y píldoras numéricas. Se oculta automáticamente si totalItems <= pageSize.
 */
@Component({
  selector: 'app-cluster-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (shouldShow()) {
      <div class="px-4 sm:px-6 py-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        <div class="text-slate-500 font-medium">
          Mostrando
          <span class="font-bold text-slate-800 font-mono">{{ fromIndex() }} - {{ toIndex() }}</span>
          de
          <span class="font-bold text-slate-800 font-mono">{{ totalItems() }}</span>
          {{ entityLabel() }}
        </div>

        <div class="flex items-center gap-1">
          <!-- Anterior -->
          <button
            type="button"
            (click)="prev()"
            [disabled]="!canPrev()"
            class="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-35 disabled:cursor-not-allowed shadow-2xs cursor-pointer active:scale-95"
            title="Página anterior"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Números de Página -->
          @for (p of pages(); track p) {
            <button
              type="button"
              (click)="goToPage(p)"
              [ngClass]="
                p === currentPage()
                  ? 'bg-[#11406e] text-white font-bold border-[#11406e] shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200 font-medium'
              "
              class="w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              {{ p }}
            </button>
          }

          <!-- Siguiente -->
          <button
            type="button"
            (click)="next()"
            [disabled]="!canNext()"
            class="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-35 disabled:cursor-not-allowed shadow-2xs cursor-pointer active:scale-95"
            title="Página siguiente"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClusterPaginationComponent {
  readonly currentPage = input.required<number>();
  readonly pageSize = input<number>(10);
  readonly totalItems = input.required<number>();
  readonly entityLabel = input<string>('elementos');

  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  readonly fromIndex = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly toIndex = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  readonly canPrev = computed(() => this.currentPage() > 1);
  readonly canNext = computed(() => this.currentPage() < this.totalPages());

  readonly shouldShow = computed(() => this.totalItems() > this.pageSize());

  readonly pages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    const result: number[] = [];
    for (let p = start; p <= end; p++) {
      result.push(p);
    }
    return result;
  });

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages() && p !== this.currentPage()) {
      this.pageChange.emit(p);
    }
  }

  prev(): void {
    if (this.canPrev()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  next(): void {
    if (this.canNext()) {
      this.goToPage(this.currentPage() + 1);
    }
  }
}
