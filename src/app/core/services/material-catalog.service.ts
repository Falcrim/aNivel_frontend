import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateMaterialCatalogItemDto,
  MaterialCatalogGrouped,
  MaterialCatalogItem,
  UpdateMaterialCatalogItemDto,
} from '../models/material-catalog.model';
import { PaginatedResponse } from '../models/pagination.model';
import { extractResults } from '../utils/pagination.utils';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class MaterialCatalogService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/materials/catalog/`;

  private readonly _items = signal<MaterialCatalogItem[]>([]);
  private readonly _groupedItems = signal<MaterialCatalogGrouped[]>([]);
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
  }): Observable<MaterialCatalogItem[]> {
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

    return this.http.get<PaginatedResponse<MaterialCatalogItem> | MaterialCatalogItem[]>(this.apiUrl, { params }).pipe(
      map((response) => extractResults(response)),
      tap(({ items, totalCount }) => {
        this._items.set(items);
        this._totalCount.set(totalCount);
      }),
      map(({ items }) => items),
      finalize(() => this._loading.set(false))
    );
  }

  loadGroupedBySubcategory(): Observable<MaterialCatalogGrouped[]> {
    this._loading.set(true);
    return this.http.get<MaterialCatalogGrouped[]>(`${this.apiUrl}grouped-by-subcategory/`).pipe(
      tap((data) => {
        this._groupedItems.set(data);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  createCatalogItem(dto: CreateMaterialCatalogItemDto): Observable<MaterialCatalogItem> {
    return this.http.post<MaterialCatalogItem>(this.apiUrl, dto).pipe(
      tap((newItem) => {
        this._items.update((list) => [newItem, ...list]);
        this._totalCount.update((c) => c + 1);
        this.toast.success(
          'Material creado en catálogo',
          `"${newItem.name}" se registró exitosamente en el catálogo maestro.`
        );
      })
    );
  }

  updateCatalogItem(
    id: number,
    dto: UpdateMaterialCatalogItemDto
  ): Observable<MaterialCatalogItem> {
    return this.http.put<MaterialCatalogItem>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._items.update((list) => list.map((item) => (item.id === id ? updated : item)));
        this.toast.success(
          'Material actualizado',
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
          'Material eliminado',
          `"${target?.name || ''}" fue eliminado del catálogo maestro.`
        );
      })
    );
  }
}
