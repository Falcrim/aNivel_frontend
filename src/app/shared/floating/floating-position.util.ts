export type FloatingPlacement = 'top' | 'bottom' | 'left' | 'right';
export type FloatingAlign = 'start' | 'center' | 'end';

export interface RectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface PanelSize {
  width: number;
  height: number;
}

export interface FloatingPositionOptions {
  preferredPlacement?: FloatingPlacement;
  align?: FloatingAlign;
  offset?: number;
  viewportPadding?: number;
  matchTriggerWidth?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  minVisibleHeight?: number;
}

export interface FloatingPositionResult {
  top: number;
  left: number;
  maxWidth: number;
  maxHeight: number;
  minWidth?: number;
  placement: FloatingPlacement;
  arrowOffset: number;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Pure geometry solver for floating panels (tooltips, select listboxes, action menus).
 * Handles automatic axis collision flipping, mobile horizontal-to-vertical fallback,
 * dynamic maxHeight clamping to remaining viewport space, and strict horizontal clamping.
 */
export function computeFloatingPosition(
  triggerRect: RectLike,
  panelSize: PanelSize,
  viewport: ViewportSize,
  options: FloatingPositionOptions = {}
): FloatingPositionResult {
  const preferredPlacement = options.preferredPlacement ?? 'bottom';
  const align = options.align ?? 'start';
  const offset = options.offset ?? 8;
  const padding = options.viewportPadding ?? 12;
  const matchTriggerWidth = options.matchTriggerWidth ?? false;
  const minVisibleHeight = options.minVisibleHeight ?? 140;

  const viewportMaxW = Math.max(120, viewport.width - padding * 2);
  const maxWidth = Math.floor(
    options.maxWidth !== undefined ? Math.max(120, Math.min(options.maxWidth, viewportMaxW)) : viewportMaxW
  );

  const minWidth = matchTriggerWidth ? Math.round(Math.min(triggerRect.width, maxWidth)) : undefined;

  const naturalWidth = panelSize.width > 0 ? panelSize.width : (minWidth ?? 200);
  const effectiveWidth = Math.min(Math.max(naturalWidth, minWidth ?? 0), maxWidth);

  const spaceAbove = Math.max(0, triggerRect.top - padding - offset);
  const spaceBelow = Math.max(0, viewport.height - triggerRect.bottom - padding - offset);
  const spaceLeft = Math.max(0, triggerRect.left - padding - offset);
  const spaceRight = Math.max(0, viewport.width - triggerRect.right - padding - offset);

  const viewportMaxH = Math.max(80, viewport.height - padding * 2);
  const fallbackDesiredH = panelSize.height > 0 ? panelSize.height : 180;
  const ceilingH = options.maxHeight ?? (panelSize.height > 0 ? panelSize.height : 288);
  const desiredH = Math.min(fallbackDesiredH, ceilingH);
  const requiredH = Math.min(desiredH, Math.max(minVisibleHeight, desiredH));

  let placement: FloatingPlacement = preferredPlacement;

  if (preferredPlacement === 'left') {
    if (spaceLeft >= effectiveWidth) {
      placement = 'left';
    } else if (spaceRight >= effectiveWidth) {
      placement = 'right';
    } else {
      placement = spaceAbove >= spaceBelow ? 'top' : 'bottom';
    }
  } else if (preferredPlacement === 'right') {
    if (spaceRight >= effectiveWidth) {
      placement = 'right';
    } else if (spaceLeft >= effectiveWidth) {
      placement = 'left';
    } else {
      placement = spaceAbove >= spaceBelow ? 'top' : 'bottom';
    }
  } else if (preferredPlacement === 'bottom') {
    if (spaceBelow >= requiredH || spaceBelow >= spaceAbove) {
      placement = 'bottom';
    } else {
      placement = 'top';
    }
  } else {
    if (spaceAbove >= requiredH || spaceAbove >= spaceBelow) {
      placement = 'top';
    } else {
      placement = 'bottom';
    }
  }

  let availableSpace: number;
  if (placement === 'top') {
    availableSpace = spaceAbove;
  } else if (placement === 'bottom') {
    availableSpace = spaceBelow;
  } else {
    availableSpace = viewportMaxH;
  }

  const maxHeightLimit = options.maxHeight !== undefined ? Math.min(options.maxHeight, viewportMaxH) : viewportMaxH;
  const maxHeight = Math.floor(Math.min(maxHeightLimit, Math.max(80, availableSpace)));

  const naturalHeight = panelSize.height > 0 ? panelSize.height : maxHeight;
  const renderedH = Math.min(naturalHeight, maxHeight);

  let rawLeft: number;
  if (placement === 'left') {
    rawLeft = triggerRect.left - offset - effectiveWidth;
  } else if (placement === 'right') {
    rawLeft = triggerRect.right + offset;
  } else if (align === 'end') {
    rawLeft = triggerRect.right - effectiveWidth;
  } else if (align === 'center') {
    rawLeft = triggerRect.left + triggerRect.width / 2 - effectiveWidth / 2;
  } else {
    rawLeft = triggerRect.left;
  }

  const left = Math.round(clamp(rawLeft, padding, viewport.width - padding - effectiveWidth));

  let rawTop: number;
  if (placement === 'bottom') {
    rawTop = triggerRect.bottom + offset;
  } else if (placement === 'top') {
    rawTop = triggerRect.top - offset - renderedH;
  } else if (align === 'start') {
    rawTop = triggerRect.top;
  } else if (align === 'end') {
    rawTop = triggerRect.bottom - renderedH;
  } else {
    rawTop = triggerRect.top + triggerRect.height / 2 - renderedH / 2;
  }

  const top = Math.round(clamp(rawTop, padding, viewport.height - padding - renderedH));

  let rawArrowOffset: number;
  if (placement === 'top' || placement === 'bottom') {
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    rawArrowOffset = clamp(triggerCenterX - left, 12, Math.max(12, effectiveWidth - 12));
  } else {
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;
    rawArrowOffset = clamp(triggerCenterY - top, 12, Math.max(12, renderedH - 12));
  }

  return {
    top,
    left,
    maxWidth,
    maxHeight,
    ...(minWidth !== undefined ? { minWidth } : {}),
    placement,
    arrowOffset: Math.round(rawArrowOffset),
  };
}

/**
 * Checks whether an anchor element is still visible within the viewport
 * and all overflow-clipping scroll ancestors.
 */
export function isAnchorVisibleInScrollAncestors(
  anchorEl: HTMLElement | null | undefined,
  viewport: ViewportSize
): boolean {
  if (!anchorEl) return false;
  const rect = anchorEl.getBoundingClientRect();

  // In headless JSDOM tests without layout, rects are 0x0; keep open rather than auto-dismissing.
  if (rect.width === 0 && rect.height === 0) {
    return true;
  }

  if (rect.bottom <= 0 || rect.top >= viewport.height || rect.right <= 0 || rect.left >= viewport.width) {
    return false;
  }

  const win = anchorEl.ownerDocument?.defaultView;
  if (!win) return true;

  let parent = anchorEl.parentElement;
  while (parent && parent !== anchorEl.ownerDocument.documentElement && parent !== anchorEl.ownerDocument.body) {
    const style = win.getComputedStyle(parent);
    const clipsOverflow = /(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`);
    if (clipsOverflow) {
      const pRect = parent.getBoundingClientRect();
      if (pRect.width > 0 || pRect.height > 0) {
        if (
          rect.bottom <= pRect.top ||
          rect.top >= pRect.bottom ||
          rect.right <= pRect.left ||
          rect.left >= pRect.right
        ) {
          return false;
        }
      }
    }
    parent = parent.parentElement;
  }

  return true;
}
