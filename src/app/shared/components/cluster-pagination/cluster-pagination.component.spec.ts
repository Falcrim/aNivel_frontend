import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ClusterPaginationComponent } from './cluster-pagination.component';

describe('ClusterPaginationComponent', () => {
  let fixture: ComponentFixture<ClusterPaginationComponent>;
  let component: ClusterPaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClusterPaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClusterPaginationComponent);
    component = fixture.componentInstance;
  });

  it('should not show when totalItems <= pageSize', () => {
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('totalItems', 8);
    fixture.componentRef.setInput('entityLabel', 'materiales');
    fixture.detectChanges();

    expect(component.shouldShow()).toBe(false);
    const hostEl = fixture.nativeElement as HTMLElement;
    expect(hostEl.querySelector('div')).toBeNull();
  });

  it('should show when totalItems > pageSize and calculate indices correctly', () => {
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('totalItems', 25);
    fixture.componentRef.setInput('entityLabel', 'materiales');
    fixture.detectChanges();

    expect(component.shouldShow()).toBe(true);
    expect(component.totalPages()).toBe(3);
    expect(component.fromIndex()).toBe(11);
    expect(component.toIndex()).toBe(20);
    expect(component.canPrev()).toBe(true);
    expect(component.canNext()).toBe(true);
  });

  it('should emit pageChange when clicking next and prev', () => {
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('totalItems', 25);
    fixture.detectChanges();

    let emittedPage = 0;
    component.pageChange.subscribe((p) => (emittedPage = p));

    component.next();
    expect(emittedPage).toBe(3);

    component.prev();
    expect(emittedPage).toBe(1);
  });
});
