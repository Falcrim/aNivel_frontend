import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, UpdateCategoryDto } from '../models/category.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/categories/`;

  private readonly _categories = signal<Category[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly categories = this._categories.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadCategories(): Observable<Category[]> {
    this._loading.set(true);
    return this.http.get<Category[]>(this.apiUrl).pipe(
      tap((data) => {
        this._categories.set(data);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  updateCategory(id: number, dto: UpdateCategoryDto): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._categories.update((list) =>
          list.map((c) => (c.id === id ? updated : c))
        );
        this.toast.success('Categoría actualizada', `Se actualizó a "${updated.name}".`);
      })
    );
  }
}
