import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { MaterialCatalogGrouped, MaterialCatalogItem, UpdateMaterialCatalogItemDto } from '../models/material-catalog.model';
import { MaterialCatalogService } from './material-catalog.service';
import { ToastService } from './toast.service';

describe('MaterialCatalogService', () => {
  let service: MaterialCatalogService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/materials/catalog/`;

  const mockItem: MaterialCatalogItem = {
    id: 1,
    name: 'Fierro 12mm',
    description: 'Barra corrugada',
    subcategory: 2,
    subcategory_detail: { id: 2, name: 'Fierros', category: 1, category_name: 'Materiales' },
    unit_measure: 1,
    unit_measure_detail: { id: 1, name: 'Metro lineal', abbreviation: 'ml' },
    unit_purchase: 2,
    unit_purchase_detail: { id: 2, name: 'Barra 12m', abbreviation: 'barra' },
    conversion_factor: 12,
    weight_per_purchase_unit: 10.65,
    waste_pct: 0.1,
    price_per_purchase_unit: 65.5,
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  const mockGrouped: MaterialCatalogGrouped[] = [
    {
      subcategory_id: 2,
      subcategory_name: 'Fierros',
      category_name: 'Materiales',
      items_count: 1,
      items: [mockItem],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MaterialCatalogService,
        ToastService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(MaterialCatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and have initial state', () => {
    expect(service).toBeTruthy();
    expect(service.items()).toEqual([]);
    expect(service.groupedItems()).toEqual([]);
    expect(service.totalCount()).toBe(0);
    expect(service.loading()).toBe(false);
  });

  it('should load catalog with filters and paginated response', () => {
    service
      .loadCatalog({ subcategory: 2, is_active: true, search: 'fierro', page: 1, page_size: 10 })
      .subscribe((items) => {
        expect(items.length).toBe(1);
        expect(items[0].name).toBe('Fierro 12mm');
      });

    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne(
      `${apiUrl}?subcategory=2&is_active=true&search=fierro&page=1&page_size=10`
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      count: 1,
      next: null,
      previous: null,
      results: [mockItem],
    });

    expect(service.items().length).toBe(1);
    expect(service.totalCount()).toBe(1);
    expect(service.loading()).toBe(false);
  });

  it('should load grouped items by subcategory', () => {
    service.loadGroupedBySubcategory().subscribe((groups) => {
      expect(groups.length).toBe(1);
      expect(groups[0].subcategory_name).toBe('Fierros');
    });

    const req = httpMock.expectOne(`${apiUrl}grouped-by-subcategory/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockGrouped);

    expect(service.groupedItems().length).toBe(1);
  });

  it('should create catalog item and prepend to signal', () => {
    const dto = {
      subcategory: 2,
      name: 'Fierro 12mm',
      unit_measure: 1,
      unit_purchase: 2,
      conversion_factor: 12,
      waste_pct: 0.1,
      price_per_purchase_unit: 65.5,
      is_active: true,
    };

    service.createCatalogItem(dto).subscribe((item) => {
      expect(item.id).toBe(1);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockItem);

    expect(service.items().length).toBe(1);
    expect(service.totalCount()).toBe(1);
  });

  it('should update catalog item and update list signal', () => {
    service['_items'].set([mockItem]);

    const dto: UpdateMaterialCatalogItemDto = {
      subcategory: 2,
      name: 'Fierro 12mm Especial',
      unit_measure: 1,
      unit_purchase: 2,
    };
    service.updateCatalogItem(1, dto).subscribe((updated) => {
      expect(updated.name).toBe('Fierro 12mm Especial');
    });

    const req = httpMock.expectOne(`${apiUrl}1/`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockItem, name: 'Fierro 12mm Especial' });

    expect(service.items()[0].name).toBe('Fierro 12mm Especial');
  });

  it('should delete catalog item and remove from signal', () => {
    service['_items'].set([mockItem]);
    service['_totalCount'].set(1);

    service.deleteCatalogItem(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.items().length).toBe(0);
    expect(service.totalCount()).toBe(0);
  });
});
