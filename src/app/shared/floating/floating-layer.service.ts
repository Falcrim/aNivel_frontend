import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';

export type FloatingLayerKind = 'tooltip' | 'dropdown' | 'menu';

export interface FloatingLayerEntry {
  id: string;
  kind: FloatingLayerKind;
  close: () => void;
}

@Injectable({ providedIn: 'root' })
export class FloatingLayerService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private layers: FloatingLayerEntry[] = [];

  private readonly onWindowKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.hasOpenLayer()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeTopmost();
    }
  };

  constructor() {
    const win = this.document.defaultView;
    if (win) {
      win.addEventListener('keydown', this.onWindowKeydown, { capture: true });
      this.destroyRef.onDestroy(() => {
        win.removeEventListener('keydown', this.onWindowKeydown, { capture: true });
      });
    }
  }

  register(entry: FloatingLayerEntry): () => void {
    this.layers = this.layers.filter((existing) => existing.id !== entry.id);

    if (entry.kind === 'tooltip') {
      const staleTooltips = this.layers.filter((existing) => existing.kind === 'tooltip');
      this.layers = this.layers.filter((existing) => existing.kind !== 'tooltip');
      for (const tip of staleTooltips) {
        tip.close();
      }
    } else {
      const staleSelectsOrMenus = this.layers.filter(
        (existing) => existing.kind === 'dropdown' || existing.kind === 'menu'
      );
      this.layers = this.layers.filter(
        (existing) => existing.kind !== 'dropdown' && existing.kind !== 'menu'
      );
      for (const layer of staleSelectsOrMenus) {
        layer.close();
      }
    }

    this.layers.push(entry);

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.layers = this.layers.filter((existing) => existing.id !== entry.id);
    };
  }

  hasOpenLayer(): boolean {
    return this.layers.length > 0;
  }

  closeTopmost(): boolean {
    const top = this.layers.pop();
    if (!top) return false;
    top.close();
    return true;
  }

  closeAll(kind?: FloatingLayerKind): void {
    const targets = kind
      ? this.layers.filter((existing) => existing.kind === kind)
      : [...this.layers];

    if (targets.length === 0) return;

    this.layers = kind ? this.layers.filter((existing) => existing.kind !== kind) : [];
    for (const entry of targets) {
      entry.close();
    }
  }
}
