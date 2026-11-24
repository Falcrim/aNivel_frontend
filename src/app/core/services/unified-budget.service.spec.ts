import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { UnifiedBudgetService } from './unified-budget.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';
import { BudgetItemGrouped, BudgetStageGrouped, BudgetSummary } from '../models/budget-item.model';

describe('UnifiedBudgetService', () => {
  let service: UnifiedBudgetService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/core/budget-items`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UnifiedBudgetService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(UnifiedBudgetService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load grouped budget items by project and category_type', () => {
    const mockGroups: BudgetItemGrouped[] = [
      {
        subcategory_id: 1,
        subcategory_name: 'Cementos',
        category_name: 'Materiales',
        items_count: 1,
        subtotal_cost_bs: '2600.00',
        subtotal_cost_usd: '373.03',
        subtotal_weight_kg: '2500.0000',
        total_purchase_units_summary: '50 Bolsa',
        items: [],
      },
    ];

    service.loadGrouped(10, 'materials').subscribe((groups) => {
      expect(groups.length).toBe(1);
      expect(service.groupedItems()[0].subcategory_name).toBe('Cementos');
    });

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${baseUrl}/by-project/` &&
        r.params.get('project') === '10' &&
        r.params.get('category_type') === 'materials'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockGroups);
  });

  it('should load grouped budget items by stage (2-level hierarchy)', () => {
    const mockStages: BudgetStageGrouped[] = [
      {
        stage_id: 1,
        stage_name: 'Obra Gruesa',
        stage_color: 'amber',
        stage_order: 1,
        items_count: 2,
        subtotal_cost_bs: '5000.00',
        subtotal_cost_usd: '717.36',
        percentage_of_family: '60.0%',
        cost_per_m2_usd: '3.58',
        subcategories: [
          {
            subcategory_id: 1,
            subcategory_name: 'Cementos',
            items_count: 1,
            subtotal_cost_bs: '2000.00',
            subtotal_cost_usd: '286.94',
            total_purchase_units_summary: '40 Bolsa',
            items: [],
          },
        ],
      },
    ];

    service.loadGroupedByStage(10, 'materials').subscribe((stages) => {
      expect(stages.length).toBe(1);
      expect(service.stagesGrouped()[0].stage_name).toBe('Obra Gruesa');
      expect(service.stagesGrouped()[0].percentage_of_family).toBe('60.0%');
    });

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${baseUrl}/by-stage/` &&
        r.params.get('project') === '10' &&
        r.params.get('category_type') === 'materials'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockStages);
  });

  it('should load project budget summary', () => {
    const mockSummary: BudgetSummary = {
      project_id: 10,
      project_name: 'Obra Central',
      built_area: '200.00',
      exchange_rate: '6.9700',
      total_budget_bs: '10000.00',
      total_budget_usd: '1434.72',
      cost_per_m2_usd: '7.17',
      total_weight_kg: '500.0000',
      total_items_count: 3,
      materials: { total_cost_bs: '6000.00', total_cost_usd: '860.83', total_weight_kg: '500.0000', items_count: 1 },
      labor: { total_cost_bs: '3000.00', total_cost_usd: '430.42', cost_per_m2_usd: '2.15', items_count: 1 },
      operating: { total_cost_bs: '500.00', total_cost_usd: '71.74', items_count: 1 },
      administrative: { total_cost_bs: '500.00', total_cost_usd: '71.74', items_count: 0 },
    };

    service.loadSummary(10).subscribe((summary) => {
      expect(summary.total_budget_bs).toBe('10000.00');
      expect(service.summary()?.cost_per_m2_usd).toBe('7.17');
    });

    const req = httpTesting.expectOne(
      (r) => r.url === `${baseUrl}/summary/` && r.params.get('project') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should instantiate a budget item from catalog with apply_ceil and stage', () => {
    service
      .createFromCatalog({
        project: 10,
        catalog_type: 'materials',
        catalog_id: 5,
        stage: 2,
        quantity_obra: 100,
        apply_ceil: true,
      })
      .subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/from-catalog/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.apply_ceil).toBe(true);
    expect(req.request.body.stage).toBe(2);
    req.flush({ id: 99, name: 'Fierro 12mm' });
  });
});
