import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { LaborCatalogGrouped, LaborCatalogItem, UpdateLaborCatalogItemDto } from '../models/labor-catalog.model';
import { LaborCatalogService } from './labor-catalog.service';
import { ToastService } from './toast.service';

describe('LaborCatalogService', () => {
  let service: LaborCatalogService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/labor/catalog/`;

  const mockItem: LaborCatalogItem = {
    id: 1,
    name: 'Pintura de muro terminada',
    detail: 'Dos manos de látex',
    subcategory: 4,
    subcategory_detail: { id: 4, name: 'Obra Fina', category: 2, category_name: 'Mano de Obra' },
    unit: 1,
    unit_detail: { id: 1, name: 'Metro Cuadrado', abbreviation: 'm2' },
    suggested_cost: 15.0,
    contractor_type: 'Pintor',
    is_active: true,
  };

  const mockGrouped: LaborCatalogGrouped[] = [
    {
      subcategory_id: 4,
      subcategory_name: 'Obra Fina',
      items_count: 1,
      items: [mockItem],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LaborCatalogService,
        ToastService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(LaborCatalogService);
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
      .loadCatalog({ subcategory: 4, is_active: true, search: 'pintura', page: 1, page_size: 10 })
      .subscribe((items) => {
        expect(items.length).toBe(1);
        expect(items[0].name).toBe('Pintura de muro terminada');
      });

    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne(
      `${apiUrl}?subcategory=4&is_active=true&search=pintura&page=1&page_size=10`
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
      expect(groups[0].subcategory_name).toBe('Obra Fina');
    });

    const req = httpMock.expectOne(`${apiUrl}grouped-by-subcategory/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockGrouped);

    expect(service.groupedItems().length).toBe(1);
  });

  it('should create labor catalog item and prepend to signal', () => {
    const dto = {
      subcategory: 4,
      name: 'Pintura de muro terminada',
      unit: 1,
      suggested_cost: 15.0,
      contractor_type: 'Pintor',
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

  it('should update labor catalog item and update list signal', () => {
    service['_items'].set([mockItem]);

    const dto: UpdateLaborCatalogItemDto = {
      name: 'Pintura Especial',
      suggested_cost: 18.0,
    };
    service.updateCatalogItem(1, dto).subscribe((updated) => {
      expect(updated.name).toBe('Pintura Especial');
    });

    const req = httpMock.expectOne(`${apiUrl}1/`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockItem, name: 'Pintura Especial', suggested_cost: 18.0 });

    expect(service.items()[0].name).toBe('Pintura Especial');
  });

  it('should delete labor catalog item and remove from signal', () => {
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
