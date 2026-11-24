import { describe, expect, it } from 'vitest';
import { computeFloatingPosition } from './floating-position.util';

describe('computeFloatingPosition', () => {
  const desktopViewport = { width: 1280, height: 768 };

  it('positions panel below trigger by default when space is sufficient', () => {
    const res = computeFloatingPosition(
      { top: 120, left: 200, right: 420, bottom: 162, width: 220, height: 42 },
      { width: 220, height: 180 },
      desktopViewport,
      { preferredPlacement: 'bottom', align: 'start', offset: 6, viewportPadding: 12 }
    );

    expect(res.placement).toBe('bottom');
    expect(res.top).toBe(168);
    expect(res.left).toBe(200);
    expect(res.maxHeight).toBeGreaterThanOrEqual(180);
  });

  it('auto-flips from bottom to top when trigger is near bottom of viewport (e.g. UNIDAD OBRA inside modal)', () => {
    const res = computeFloatingPosition(
      { top: 650, left: 320, right: 540, bottom: 692, width: 220, height: 42 },
      { width: 220, height: 240 },
      desktopViewport,
      { preferredPlacement: 'bottom', align: 'start', offset: 6, viewportPadding: 12, maxHeight: 288 }
    );

    expect(res.placement).toBe('top');
    expect(res.top).toBe(650 - 6 - 240);
    expect(res.top).toBeGreaterThanOrEqual(12);
  });

  it('auto-flips from top to bottom when trigger is near top of viewport (e.g. ETAPA CONSTRUCTIVA inside modal)', () => {
    const res = computeFloatingPosition(
      { top: 45, left: 500, right: 516, bottom: 61, width: 16, height: 16 },
      { width: 256, height: 110 },
      desktopViewport,
      { preferredPlacement: 'top', align: 'center', offset: 8, viewportPadding: 12 }
    );

    expect(res.placement).toBe('bottom');
    expect(res.top).toBe(69);
  });

  it('clamps left coordinate within viewport right padding (e.g. FACTOR CONVERSIÓN tooltip near modal edge)', () => {
    const res = computeFloatingPosition(
      { top: 300, left: 1248, right: 1264, bottom: 316, width: 16, height: 16 },
      { width: 256, height: 100 },
      desktopViewport,
      { preferredPlacement: 'top', align: 'center', offset: 8, viewportPadding: 12 }
    );

    expect(res.left + 256).toBeLessThanOrEqual(desktopViewport.width - 12);
    expect(res.left).toBe(1280 - 12 - 256);
    expect(res.arrowOffset).toBeGreaterThanOrEqual(12);
  });

  it('clamps left coordinate within viewport left padding', () => {
    const res = computeFloatingPosition(
      { top: 300, left: 4, right: 20, bottom: 316, width: 16, height: 16 },
      { width: 256, height: 100 },
      desktopViewport,
      { preferredPlacement: 'top', align: 'center', offset: 8, viewportPadding: 12 }
    );

    expect(res.left).toBe(12);
  });

  it('falls back from horizontal right/left placement to vertical on narrow mobile viewports', () => {
    const mobileViewport = { width: 375, height: 667 };
    const res = computeFloatingPosition(
      { top: 260, left: 190, right: 206, bottom: 276, width: 16, height: 16 },
      { width: 256, height: 110 },
      mobileViewport,
      { preferredPlacement: 'right', align: 'center', offset: 8, viewportPadding: 12 }
    );

    expect(['top', 'bottom']).toContain(res.placement);
    expect(res.left).toBeGreaterThanOrEqual(12);
    expect(res.left + 256).toBeLessThanOrEqual(mobileViewport.width - 12);
  });

  it('caps maxHeight dynamically to remaining viewport space and sets minWidth when matchTriggerWidth is true', () => {
    const shortViewport = { width: 1024, height: 320 };
    const res = computeFloatingPosition(
      { top: 100, left: 100, right: 340, bottom: 142, width: 240, height: 42 },
      { width: 240, height: 400 },
      shortViewport,
      { preferredPlacement: 'bottom', matchTriggerWidth: true, offset: 6, viewportPadding: 12, maxHeight: 288 }
    );

    expect(res.minWidth).toBe(240);
    expect(res.maxHeight).toBe(320 - 142 - 12 - 6);
  });
});
