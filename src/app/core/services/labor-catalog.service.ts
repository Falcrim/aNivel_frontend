import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateLaborCatalogItemDto,
  LaborCatalogItem,
  UpdateLaborCatalogItemDto,
} from '../models/labor-catalog.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class LaborCatalogService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/labor/catalog/`;

  private readonly _items = signal<LaborCatalogItem[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadCatalog(filters?: {
    subcategory?: number;
    is_active?: boolean;
    search?: string;
    ordering?: string;
  }): Observable<LaborCatalogItem[]> {
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

    return this.http.get<LaborCatalogItem[]>(this.apiUrl, { params }).pipe(
      tap((data) => this._items.set(data)),
      finalize(() => this._loading.set(false))
    );
  }

  createCatalogItem(dto: CreateLaborCatalogItemDto): Observable<LaborCatalogItem> {
    return this.http.post<LaborCatalogItem>(this.apiUrl, dto).pipe(
      tap((newItem) => {
        this._items.update((list) => [newItem, ...list]);
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
        this.toast.success(
          'Tarea eliminada',
          `"${target?.name || ''}" fue retirada del catálogo maestro.`
        );
      })
    );
  }
}
