import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateMaterialCatalogItemDto,
  MaterialCatalogGrouped,
  MaterialCatalogItem,
  UpdateMaterialCatalogItemDto,
} from '../models/material-catalog.model';
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
  private readonly _loading = signal<boolean>(false);

  readonly items = this._items.asReadonly();
  readonly groupedItems = this._groupedItems.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadCatalog(filters?: {
    subcategory?: number;
    is_active?: boolean;
    search?: string;
    ordering?: string;
  }): Observable<MaterialCatalogItem[]> {
    this._loading.set(true);
    let params = new HttpParams();

    if (filters?.subcategory) {
      params = params.set('subcategory', filters.subcategory.toString());
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

    return this.http.get<MaterialCatalogItem[]>(this.apiUrl, { params }).pipe(
      tap((data) => {
        this._items.set(data);
      }),
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
        this.toast.success(
          'Material eliminado',
          `"${target?.name || ''}" fue eliminado del catálogo maestro.`
        );
      })
    );
  }
}
