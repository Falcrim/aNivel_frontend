import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateSubcategoryDto, Subcategory, UpdateSubcategoryDto } from '../models/subcategory.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class SubcategoryService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/subcategories/`;

  private readonly _subcategories = signal<Subcategory[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly subcategories = this._subcategories.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadSubcategories(): Observable<Subcategory[]> {
    this._loading.set(true);
    return this.http.get<Subcategory[]>(this.apiUrl).pipe(
      tap((data) => {
        this._subcategories.set(data);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  createSubcategory(dto: CreateSubcategoryDto): Observable<Subcategory> {
    return this.http.post<Subcategory>(this.apiUrl, dto).pipe(
      tap((newSub) => {
        this._subcategories.update((list) => [...list, newSub]);
        this.toast.success('Subcategoría creada', `La subcategoría "${newSub.name}" fue creada exitosamente.`);
      })
    );
  }

  updateSubcategory(id: number, dto: UpdateSubcategoryDto): Observable<Subcategory> {
    return this.http.put<Subcategory>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._subcategories.update((list) =>
          list.map((s) => (s.id === id ? updated : s))
        );
        this.toast.success('Subcategoría actualizada', `Se actualizó a "${updated.name}".`);
      })
    );
  }

  deleteSubcategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._subcategories().find((s) => s.id === id);
        this._subcategories.update((list) => list.filter((s) => s.id !== id));
        this.toast.success('Subcategoría eliminada', `La subcategoría "${target?.name || ''}" fue eliminada.`);
      })
    );
  }
}
