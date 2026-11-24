import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { FloatingLayerService } from './floating-layer.service';

describe('FloatingLayerService', () => {
  it('closes any existing tooltip when opening a new tooltip, without closing an open dropdown', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(FloatingLayerService);

    const closeDropdown = vi.fn();
    const closeTip1 = vi.fn();
    const closeTip2 = vi.fn();

    service.register({ id: 'select-1', kind: 'dropdown', close: closeDropdown });
    service.register({ id: 'tip-1', kind: 'tooltip', close: closeTip1 });
    service.register({ id: 'tip-2', kind: 'tooltip', close: closeTip2 });

    expect(closeTip1).toHaveBeenCalledTimes(1);
    expect(closeTip2).not.toHaveBeenCalled();
    expect(closeDropdown).not.toHaveBeenCalled();
    expect(service.hasOpenLayer()).toBe(true);
  });

  it('closes an existing dropdown or menu when opening another dropdown or menu', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(FloatingLayerService);

    const closeSelect = vi.fn();
    const closeMenu = vi.fn();

    service.register({ id: 'select-1', kind: 'dropdown', close: closeSelect });
    service.register({ id: 'menu-1', kind: 'menu', close: closeMenu });

    expect(closeSelect).toHaveBeenCalledTimes(1);
    expect(closeMenu).not.toHaveBeenCalled();
  });

  it('intercepts Escape in capture phase, calls preventDefault, and closes only the topmost layer', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(FloatingLayerService);

    const closeDropdown = vi.fn();
    const closeTip = vi.fn();

    service.register({ id: 'select-1', kind: 'dropdown', close: closeDropdown });
    service.register({ id: 'tip-1', kind: 'tooltip', close: closeTip });

    const firstEsc = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(firstEsc);

    expect(firstEsc.defaultPrevented).toBe(true);
    expect(closeTip).toHaveBeenCalledTimes(1);
    expect(closeDropdown).not.toHaveBeenCalled();
    expect(service.hasOpenLayer()).toBe(true);

    const secondEsc = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(secondEsc);

    expect(secondEsc.defaultPrevented).toBe(true);
    expect(closeDropdown).toHaveBeenCalledTimes(1);
    expect(service.hasOpenLayer()).toBe(false);
  });

  it('does not preventDefault on Escape when no floating layer is open', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(FloatingLayerService);

    expect(service.hasOpenLayer()).toBe(false);
    const esc = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(esc);

    expect(esc.defaultPrevented).toBe(false);
  });
});
