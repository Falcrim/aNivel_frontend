import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FloatingLayerKind, FloatingLayerService } from './floating-layer.service';
import {
  computeFloatingPosition,
  FloatingAlign,
  FloatingPlacement,
  isAnchorVisibleInScrollAncestors,
} from './floating-position.util';

let nextFloatingLayerId = 0;

@Directive({
  selector: '[anFloatingPanel]',
  standalone: true,
})
export class FloatingPanelDirective implements OnInit, AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly floatingLayer = inject(FloatingLayerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  readonly anFloatingAnchor = input.required<HTMLElement | null>();
  readonly anFloatingPlacement = input<FloatingPlacement>('bottom');
  readonly anFloatingAlign = input<FloatingAlign>('start');
  readonly anFloatingOffset = input<number>(8);
  readonly anFloatingPadding = input<number>(12);
  readonly anFloatingMatchWidth = input<boolean>(false);
  readonly anFloatingMaxWidth = input<number | undefined>(undefined);
  readonly anFloatingMaxHeight = input<number | undefined>(undefined);
  readonly anFloatingKind = input<FloatingLayerKind>('dropdown');
  readonly anFloatingDismissOnScrollOut = input<boolean>(true);

  readonly anFloatingDismiss = output<void>();
  readonly anFloatingPlacementResolved = output<FloatingPlacement>();

  private readonly layerId = `an-floating-${++nextFloatingLayerId}`;
  private unregisterLayer: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafId: number | null = null;
  private initializedView = false;
  private destroyed = false;
  private lastResolvedPlacement: FloatingPlacement | null = null;

  private readonly onScroll = (event: Event): void => {
    const panelEl = this.elementRef.nativeElement;
    if (event.target instanceof Node && panelEl.contains(event.target)) {
      return;
    }
    this.scheduleUpdate();
  };

  private readonly onResize = (): void => {
    this.scheduleUpdate();
  };

  constructor() {
    effect(() => {
      this.anFloatingAnchor();
      this.anFloatingPlacement();
      this.anFloatingAlign();
      this.anFloatingOffset();
      this.anFloatingPadding();
      this.anFloatingMatchWidth();
      this.anFloatingMaxWidth();
      this.anFloatingMaxHeight();

      if (this.initializedView) {
        this.scheduleUpdate();
      }
    });
  }

  ngOnInit(): void {
    const el = this.elementRef.nativeElement;
    el.classList.add('an-floating-layer');
    el.setAttribute('popover', 'manual');
    el.style.visibility = 'hidden';

    this.unregisterLayer = this.floatingLayer.register({
      id: this.layerId,
      kind: this.anFloatingKind(),
      close: () => {
        this.anFloatingDismiss.emit();
      },
    });

    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  ngAfterViewInit(): void {
    this.initializedView = true;
    const el = this.elementRef.nativeElement;
    const win = this.document.defaultView;

    this.openPopover(el);

    if (win) {
      win.addEventListener('scroll', this.onScroll, { capture: true, passive: true });
      win.addEventListener('resize', this.onResize, { passive: true });

      if (typeof win.ResizeObserver === 'function') {
        this.resizeObserver = new win.ResizeObserver(() => {
          this.scheduleUpdate();
        });
        this.resizeObserver.observe(el);
      }
    }

    this.updatePosition();
    this.scheduleUpdate();
  }

  private openPopover(el: HTMLElement): void {
    const popoverEl = el as HTMLElement & { showPopover?: () => void };
    if (typeof popoverEl.showPopover === 'function') {
      try {
        if (typeof el.matches !== 'function' || !el.matches(':popover-open')) {
          popoverEl.showPopover();
        }
      } catch {
        // Fallback relies on position: fixed + z-index: 9999
      }
    }
  }

  private closePopover(el: HTMLElement): void {
    const popoverEl = el as HTMLElement & { hidePopover?: () => void };
    if (typeof popoverEl.hidePopover === 'function') {
      try {
        if (typeof el.matches !== 'function' || el.matches(':popover-open')) {
          popoverEl.hidePopover();
        }
      } catch {
        // Ignore when already closed or detached
      }
    }
  }

  private scheduleUpdate(): void {
    if (this.destroyed) return;
    const win = this.document.defaultView;
    if (!win || typeof win.requestAnimationFrame !== 'function') {
      this.updatePosition();
      return;
    }
    if (this.rafId !== null) {
      win.cancelAnimationFrame(this.rafId);
    }
    this.rafId = win.requestAnimationFrame(() => {
      this.rafId = null;
      if (!this.destroyed) {
        this.updatePosition();
      }
    });
  }

  private updatePosition(): void {
    if (this.destroyed) return;
    const el = this.elementRef.nativeElement;
    const anchor = this.anFloatingAnchor();
    const win = this.document.defaultView;

    const viewport = {
      width: win?.innerWidth || 1024,
      height: win?.innerHeight || 768,
    };

    if (!anchor) {
      el.style.visibility = 'hidden';
      return;
    }

    if (this.anFloatingDismissOnScrollOut() && !isAnchorVisibleInScrollAncestors(anchor, viewport)) {
      this.anFloatingDismiss.emit();
      return;
    }

    const triggerRect = anchor.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    const measuredWidth = el.offsetWidth || rect.width || 0;
    const measuredHeight = el.scrollHeight || el.offsetHeight || rect.height || 0;

    const result = computeFloatingPosition(
      triggerRect,
      { width: measuredWidth, height: measuredHeight },
      viewport,
      {
        preferredPlacement: this.anFloatingPlacement(),
        align: this.anFloatingAlign(),
        offset: this.anFloatingOffset(),
        viewportPadding: this.anFloatingPadding(),
        matchTriggerWidth: this.anFloatingMatchWidth(),
        maxWidth: this.anFloatingMaxWidth(),
        maxHeight: this.anFloatingMaxHeight(),
      }
    );

    el.style.position = 'fixed';
    el.style.top = `${result.top}px`;
    el.style.left = `${result.left}px`;
    el.style.maxWidth = `${result.maxWidth}px`;
    el.style.maxHeight = `${result.maxHeight}px`;

    if (result.minWidth !== undefined) {
      el.style.minWidth = `${result.minWidth}px`;
    } else {
      el.style.removeProperty('min-width');
    }

    el.style.setProperty('--an-arrow-offset', `${result.arrowOffset}px`);
    el.dataset['placement'] = result.placement;
    el.style.visibility = 'visible';

    if (this.lastResolvedPlacement !== result.placement) {
      this.lastResolvedPlacement = result.placement;
      this.anFloatingPlacementResolved.emit(result.placement);
    }
  }

  private cleanup(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    const el = this.elementRef.nativeElement;
    const win = this.document.defaultView;

    if (this.rafId !== null && win && typeof win.cancelAnimationFrame === 'function') {
      win.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (win) {
      win.removeEventListener('scroll', this.onScroll, { capture: true });
      win.removeEventListener('resize', this.onResize);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.unregisterLayer) {
      this.unregisterLayer();
      this.unregisterLayer = null;
    }

    this.closePopover(el);
  }
}
