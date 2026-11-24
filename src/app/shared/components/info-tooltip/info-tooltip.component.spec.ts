import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { InfoTooltipComponent } from './info-tooltip.component';

describe('InfoTooltipComponent', () => {
  let component: InfoTooltipComponent;
  let fixture: ComponentFixture<InfoTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoTooltipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoTooltipComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('text', 'Explicación útil para el usuario.');
    fixture.detectChanges();
  });

  afterEach(() => {
    component.closeNow();
    fixture.detectChanges();
  });

  it('keeps tooltip unmounted when closed so overflow containers never gain phantom scrollbars', () => {
    expect(component).toBeTruthy();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[role="tooltip"]')).toBeNull();
    expect(el.textContent).not.toContain('Explicación útil para el usuario.');
  });

  it('mounts tooltip with popover="manual" and an-floating-layer on hover/focus/click', () => {
    fixture.componentRef.setInput('title', 'Redondeo');
    fixture.componentRef.setInput('position', 'bottom');

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    const tipEl = fixture.nativeElement.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tipEl).toBeTruthy();
    expect(tipEl.getAttribute('popover')).toBe('manual');
    expect(tipEl.classList.contains('an-floating-layer')).toBe(true);
    expect(tipEl.textContent).toContain('Redondeo');
    expect(tipEl.textContent).toContain('Explicación útil para el usuario.');
    expect(btn.getAttribute('aria-expanded')).toBe('true');

    const bubbleEl = tipEl.firstElementChild as HTMLElement;
    expect(bubbleEl.classList.contains('whitespace-normal')).toBe(true);
    expect(bubbleEl.classList.contains('break-words')).toBe(true);
  });

  it('dismisses open tooltip when Escape key is pressed', () => {
    component.open();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeTruthy();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('applies inverted styling when tone is inverted', () => {
    fixture.componentRef.setInput('tone', 'inverted');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.className).toContain('bg-white/20');
  });
});
