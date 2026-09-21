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

export interface CustomSelectOption<T = unknown> {
  label: string;
  value: T;
  icon?: string;
  subtitle?: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
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
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (!nextState) {
      this.searchTerm.set('');
    }
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
    this.isOpen.set(false);
    this.searchTerm.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.searchTerm.set('');
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
    this.searchTerm.set('');
  }
}
