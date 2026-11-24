import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { CustomSelectComponent, CustomSelectOption } from './custom-select.component';

describe('CustomSelectComponent', () => {
  let component: CustomSelectComponent<number>;
  let fixture: ComponentFixture<CustomSelectComponent<number>>;

  const mockOptions: CustomSelectOption<number>[] = [
    { label: 'Opción 1', value: 1 },
    { label: 'Opción 2', value: 2 },
    { label: 'Opción 3', value: 3 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomSelectComponent<number>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();
  });

  afterEach(() => {
    component.close();
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute selectedOption when value model changes', () => {
    expect(component.selectedOption()).toBeNull();

    fixture.componentRef.setInput('value', 2);
    fixture.detectChanges();

    expect(component.selectedOption()?.label).toBe('Opción 2');
    expect(component.selectedOption()?.value).toBe(2);
  });

  it('uses safe line-height with truncate on trigger label and placeholder so descenders are never clipped', () => {
    const placeholderSpan = fixture.nativeElement.querySelector('button span.truncate') as HTMLElement;
    expect(placeholderSpan).toBeTruthy();
    expect(placeholderSpan.classList.contains('leading-normal')).toBe(true);
    expect(placeholderSpan.classList.contains('leading-none')).toBe(false);

    fixture.componentRef.setInput('options', [{ label: 'Hormigón Armado', value: 99 }]);
    fixture.componentRef.setInput('value', 99);
    fixture.detectChanges();

    const valueSpan = fixture.nativeElement.querySelector('button span.truncate') as HTMLElement;
    expect(valueSpan.textContent).toContain('Hormigón Armado');
    expect(valueSpan.classList.contains('leading-normal')).toBe(true);
    expect(valueSpan.classList.contains('leading-none')).toBe(false);
  });

  it('should toggle isOpen state and mount Top-Layer listbox without absolute positioning', () => {
    expect(component.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();

    component.toggle();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox).toBeTruthy();
    expect(listbox.getAttribute('popover')).toBe('manual');
    expect(listbox.classList.contains('an-floating-layer')).toBe(true);
    expect(listbox.classList.contains('absolute')).toBe(false);
  });

  it('should filter options based on searchTerm', () => {
    component.searchTerm.set('Opción 3');
    fixture.detectChanges();

    expect(component.filteredOptions().length).toBe(1);
    expect(component.filteredOptions()[0].value).toBe(3);
  });

  it('should close and clear searchTerm on Escape via FloatingLayerService', () => {
    component.toggle();
    component.searchTerm.set('Opción');
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(component.searchTerm()).toBe('');
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
  });
});
