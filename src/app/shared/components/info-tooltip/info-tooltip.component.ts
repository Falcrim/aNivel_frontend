import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { FloatingPanelDirective } from '../../floating/floating-panel.directive';
import { FloatingPlacement } from '../../floating/floating-position.util';

let nextInfoTooltipId = 0;

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule, FloatingPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="relative inline-flex items-center align-middle shrink-0">
      <button
        #triggerRef
        type="button"
        (click)="toggleFromClick($event)"
        (mouseenter)="open()"
        (mouseleave)="scheduleClose()"
        (focus)="open()"
        (blur)="onTriggerBlur()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-describedby]="isOpen() ? tooltipId : null"
        [ngClass]="
          tone() === 'inverted'
            ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
            : 'bg-[#e2e9f2] text-[#11406e] border-[#c3d3e5] hover:bg-[#11406e] hover:text-white hover:border-[#11406e]'
        "
        class="w-4 h-4 rounded-full border inline-flex items-center justify-center text-[10px] font-black leading-none transition-colors cursor-help focus:outline-hidden focus:ring-2 focus:ring-[#11406e]/30"
      >
        ?
      </button>

      @if (isOpen()) {
        <div
          [id]="tooltipId"
          role="tooltip"
          anFloatingPanel
          [anFloatingAnchor]="triggerRef"
          [anFloatingPlacement]="position()"
          anFloatingAlign="center"
          [anFloatingOffset]="8"
          [anFloatingMaxWidth]="272"
          anFloatingKind="tooltip"
          (anFloatingDismiss)="closeNow()"
          (anFloatingPlacementResolved)="resolvedPlacement.set($event)"
          (mouseenter)="cancelClose()"
          (mouseleave)="scheduleClose()"
          class="an-floating-enter"
        >
          <div
            class="w-64 max-w-full px-3 py-2 rounded-xl bg-[#0a284b] text-white text-[11px] leading-relaxed font-normal normal-case tracking-normal text-left whitespace-normal break-words shadow-2xl border border-white/15 pointer-events-auto select-text"
          >
            @if (title()) {
              <div class="font-bold text-[11px] text-[#9ec5eb] mb-0.5 whitespace-normal break-words">{{ title() }}</div>
            }
            <span class="block whitespace-normal break-words">{{ text() }}</span>
          </div>
        </div>
      }
    </span>
  `,
})
export class InfoTooltipComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly text = input.required<string>();
  readonly title = input<string>('');
  readonly position = input<FloatingPlacement>('top');
  readonly tone = input<'default' | 'inverted'>('default');

  readonly tooltipId = `an-tooltip-${++nextInfoTooltipId}`;
  readonly isOpen = signal(false);
  readonly resolvedPlacement = signal<FloatingPlacement>('top');

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private openedByClick = false;

  readonly ariaLabel = computed(() =>
    this.title() ? `Ayuda sobre ${this.title()}` : 'Más información'
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cancelClose();
    });
  }

  open(): void {
    this.cancelClose();
    this.resolvedPlacement.set(this.position());
    this.isOpen.set(true);
  }

  toggleFromClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.isOpen() && this.openedByClick) {
      this.closeNow();
      return;
    }
    this.cancelClose();
    this.openedByClick = true;
    this.resolvedPlacement.set(this.position());
    this.isOpen.set(true);
  }

  onTriggerBlur(): void {
    this.openedByClick = false;
    this.scheduleClose();
  }

  cancelClose(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  scheduleClose(): void {
    if (this.openedByClick) return;
    this.cancelClose();
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.isOpen.set(false);
    }, 120);
  }

  closeNow(): void {
    this.cancelClose();
    this.openedByClick = false;
    this.isOpen.set(false);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: Event): void {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closeNow();
    }
  }
}
