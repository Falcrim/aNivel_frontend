import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateToolCategoryDto,
  ToolCategory,
  UpdateToolCategoryDto,
} from '../models/inventory-tool-category.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class InventoryToolCategoryService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/inventory/categories/`;

  private readonly _categories = signal<ToolCategory[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly categories = this._categories.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadCategories(): Observable<ToolCategory[]> {
    this._loading.set(true);
    return this.http.get<ToolCategory[]>(this.apiUrl).pipe(
      tap((data) => this._categories.set(data)),
      finalize(() => this._loading.set(false))
    );
  }

  createCategory(dto: CreateToolCategoryDto): Observable<ToolCategory> {
    return this.http.post<ToolCategory>(this.apiUrl, dto).pipe(
      tap((newCat) => {
        this._categories.update((list) => [...list, newCat]);
        this.toast.success('Categoría creada', `Se creó "${newCat.name}" exitosamente.`);
      })
    );
  }

  updateCategory(id: number, dto: UpdateToolCategoryDto): Observable<ToolCategory> {
    return this.http.put<ToolCategory>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._categories.update((list) =>
          list.map((c) => (c.id === id ? updated : c))
        );
        this.toast.success('Categoría actualizada', `Se actualizó "${updated.name}".`);
      })
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._categories().find((c) => c.id === id);
        this._categories.update((list) => list.filter((c) => c.id !== id));
        this.toast.success('Categoría eliminada', `Se eliminó "${target?.name || ''}".`);
      })
    );
  }
}
