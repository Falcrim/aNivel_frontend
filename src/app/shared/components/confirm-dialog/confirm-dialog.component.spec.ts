import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit confirm output when onConfirm is called and not loading', () => {
    let confirmed = false;
    component.confirm.subscribe(() => {
      confirmed = true;
    });

    component.onConfirm();
    expect(confirmed).toBe(true);
  });

  it('should emit cancel output when onCancel is called and not loading', () => {
    let cancelled = false;
    component.cancel.subscribe(() => {
      cancelled = true;
    });

    component.onCancel();
    expect(cancelled).toBe(true);
  });

  it('should have default inputs', () => {
    expect(component.isOpen()).toBe(false);
    expect(component.title()).toBe('Confirmar acción');
    expect(component.isDanger()).toBe(true);
    expect(component.loading()).toBe(false);
  });
});
