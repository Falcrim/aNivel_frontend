import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoTooltipComponent } from '../info-tooltip/info-tooltip.component';
import { FloatingPanelDirective } from '../../floating/floating-panel.directive';

export interface CustomSelectOption<T = unknown> {
  label: string;
  value: T;
  icon?: string;
  subtitle?: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent, FloatingPanelDirective],
  templateUrl: './custom-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSelectComponent<T = unknown> {
  private readonly elementRef = inject(ElementRef);

  readonly options = input.required<CustomSelectOption<T>[]>();
  readonly value = model<T | null>(null);
  readonly placeholder = input<string>('Seleccionar opción...');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly label = input<string>('');
  readonly tooltip = input<string>('');
  readonly searchable = input<boolean>(false);
  readonly searchPlaceholder = input<string>('Buscar...');

  readonly isOpen = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly selectedOption = computed(() => {
    const val = this.value();
    return this.options().find((o) => o.value === val) ?? null;
  });

  readonly isSearchActive = computed(() => {
    return this.searchable() || this.options().length > 7;
  });

  readonly filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.options();
    if (!term) return list;
    return list.filter(
      (o) =>
        o.label.toLowerCase().includes(term) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(term))
    );
  });

  constructor() {
    effect(() => {
      if (this.isOpen() && this.isSearchActive()) {
        setTimeout(() => {
          this.searchInput()?.nativeElement.focus();
        }, 50);
      }
    });
  }

  toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.isOpen.set(true);
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.searchTerm.set('');
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  clearSearch(event: MouseEvent): void {
    event.stopPropagation();
    this.searchTerm.set('');
    this.searchInput()?.nativeElement.focus();
  }

  select(option: CustomSelectOption<T>): void {
    this.value.set(option.value);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
