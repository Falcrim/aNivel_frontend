import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with defaults', () => {
    expect(component).toBeTruthy();
    expect(component.title()).toBe('No se encontraron elementos');
    expect(component.iconType()).toBe('project');
  });

  it('should emit action when output is triggered', () => {
    let triggered = false;
    component.action.subscribe(() => {
      triggered = true;
    });

    component.action.emit();
    expect(triggered).toBe(true);
  });
});
