import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ModalComponent } from './modal.component';
import { FloatingLayerService } from '../../floating/floating-layer.service';

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;
  let component: ModalComponent;
  let floatingLayer: FloatingLayerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    floatingLayer = TestBed.inject(FloatingLayerService);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Editar Material');
    fixture.detectChanges();
  });

  it('renders panel without persistent transform class so fixed descendants cannot be trapped', () => {
    const dialogEl = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const panelEl = dialogEl.querySelector('.bg-white.rounded-2xl') as HTMLElement;

    expect(panelEl).toBeTruthy();
    expect(panelEl.classList.contains('transform')).toBe(false);
    expect(panelEl.classList.contains('an-floating-enter')).toBe(true);
  });

  it('does not close the modal on Escape while an inner floating layer is open, then closes on next Escape', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    const closeDropdown = vi.fn();
    floatingLayer.register({ id: 'inner-select', kind: 'dropdown', close: closeDropdown });

    const firstEsc = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(firstEsc);

    expect(closeDropdown).toHaveBeenCalledTimes(1);
    expect(closeSpy).not.toHaveBeenCalled();

    const secondEsc = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(secondEsc);

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
