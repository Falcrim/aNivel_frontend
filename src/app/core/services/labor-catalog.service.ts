import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateLaborCatalogItemDto,
  LaborCatalogGrouped,
  LaborCatalogItem,
  UpdateLaborCatalogItemDto,
} from '../models/labor-catalog.model';
import { PaginatedResponse } from '../models/pagination.model';
import { extractResults } from '../utils/pagination.utils';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class LaborCatalogService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/labor/catalog/`;

  private readonly _items = signal<LaborCatalogItem[]>([]);
  private readonly _groupedItems = signal<LaborCatalogGrouped[]>([]);
  private readonly _totalCount = signal<number>(0);
  private readonly _loading = signal<boolean>(false);

  readonly items = this._items.asReadonly();
  readonly groupedItems = this._groupedItems.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadCatalog(filters?: {
    subcategory?: number;
    supplier?: number;
    is_active?: boolean;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Observable<LaborCatalogItem[]> {
    this._loading.set(true);
    let params = new HttpParams();

    if (filters?.subcategory) {
      params = params.set('subcategory', filters.subcategory.toString());
    }
    if (filters?.supplier) {
      params = params.set('supplier', filters.supplier.toString());
    }
    if (filters?.is_active !== undefined) {
      params = params.set('is_active', filters.is_active.toString());
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.ordering) {
      params = params.set('ordering', filters.ordering);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    } else {
      params = params.set('paginate', 'false');
    }
    if (filters?.page_size) {
      params = params.set('page_size', filters.page_size.toString());
    }

    return this.http.get<PaginatedResponse<LaborCatalogItem> | LaborCatalogItem[]>(this.apiUrl, { params }).pipe(
      map((response) => extractResults(response)),
      tap(({ items, totalCount }) => {
        this._items.set(items);
        this._totalCount.set(totalCount);
      }),
      map(({ items }) => items),
      finalize(() => this._loading.set(false))
    );
  }

  loadGroupedBySubcategory(): Observable<LaborCatalogGrouped[]> {
    this._loading.set(true);
    return this.http.get<LaborCatalogGrouped[]>(`${this.apiUrl}grouped-by-subcategory/`).pipe(
      tap((data) => {
        this._groupedItems.set(data);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  createCatalogItem(dto: CreateLaborCatalogItemDto): Observable<LaborCatalogItem> {
    return this.http.post<LaborCatalogItem>(this.apiUrl, dto).pipe(
      tap((newItem) => {
        this._items.update((list) => [newItem, ...list]);
        this._totalCount.update((c) => c + 1);
        this.toast.success(
          'Tarea registrada en catálogo',
          `"${newItem.name}" se guardó exitosamente en el tarifario maestro.`
        );
      })
    );
  }

  updateCatalogItem(
    id: number,
    dto: UpdateLaborCatalogItemDto
  ): Observable<LaborCatalogItem> {
    return this.http.patch<LaborCatalogItem>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._items.update((list) =>
          list.map((item) => (item.id === id ? { ...item, ...updated } : item))
        );
        this.toast.success(
          'Tarea actualizada',
          `Se actualizaron los datos de "${updated.name}".`
        );
      })
    );
  }

  deleteCatalogItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._items().find((item) => item.id === id);
        this._items.update((list) => list.filter((item) => item.id !== id));
        this._totalCount.update((c) => Math.max(0, c - 1));
        this.toast.success(
          'Tarea eliminada',
          `"${target?.name || ''}" fue retirada del catálogo maestro.`
        );
      })
    );
  }
}
