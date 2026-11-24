import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { SupplierService } from './supplier.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';
import { Supplier } from '../models/supplier.model';

describe('SupplierService', () => {
  let service: SupplierService;
  let httpTesting: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/core/suppliers/`;

  const mockSuppliers: Supplier[] = [
    {
      id: 1,
      name: 'Monterrey S.R.L.',
      supplier_type: 'material',
      supplier_type_display: 'Proveedor de Materiales',
      contact_name: 'Carlos M.',
      phone: '70012345',
      is_active: true,
    },
    {
      id: 2,
      name: 'Cuadrilla Flores',
      supplier_type: 'labor',
      supplier_type_display: 'Contratista de Mano de Obra',
      contact_name: 'Juan F.',
      phone: '71098765',
      is_active: true,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SupplierService,
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

    service = TestBed.inject(SupplierService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load all suppliers', () => {
    service.loadSuppliers().subscribe((suppliers) => {
      expect(suppliers.length).toBe(2);
      expect(service.suppliers().length).toBe(2);
    });

    const req = httpTesting.expectOne((r) => r.url === mockApiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockSuppliers);
  });

  it('should filter suppliers by type and search', () => {
    service.loadSuppliers('material', 'Monterrey').subscribe();

    const req = httpTesting.expectOne((r) =>
      r.url === mockApiUrl &&
      r.params.get('supplier_type') === 'material' &&
      r.params.get('search') === 'Monterrey'
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockSuppliers[0]]);
  });

  it('should create a supplier', () => {
    const newDto = {
      name: 'Prometeo Aceros',
      supplier_type: 'material' as const,
      contact_name: 'Ing. Pérez',
    };

    const createdSupplier: Supplier = {
      id: 3,
      name: 'Prometeo Aceros',
      supplier_type: 'material',
      supplier_type_display: 'Proveedor de Materiales',
      contact_name: 'Ing. Pérez',
      is_active: true,
    };

    service.createSupplier(newDto).subscribe((result) => {
      expect(result.id).toBe(3);
      expect(service.suppliers().some((s) => s.id === 3)).toBe(true);
    });

    const req = httpTesting.expectOne(mockApiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(createdSupplier);
  });

  it('should delete a supplier', () => {
    // Pre-populate signals
    service.loadSuppliers().subscribe();
    httpTesting.expectOne((r) => r.url === mockApiUrl).flush(mockSuppliers);

    service.deleteSupplier(1).subscribe(() => {
      expect(service.suppliers().some((s) => s.id === 1)).toBe(false);
    });

    const req = httpTesting.expectOne(`${mockApiUrl}1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
