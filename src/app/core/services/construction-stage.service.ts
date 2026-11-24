import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConstructionStage,
  CreateConstructionStageDto,
  UpdateConstructionStageDto,
} from '../models/construction-stage.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ConstructionStageService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/stages/`;

  private readonly _stages = signal<ConstructionStage[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _selectedStage = signal<ConstructionStage | null>(null);

  readonly stages = this._stages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selectedStage = this._selectedStage.asReadonly();

  loadStages(params?: { is_active?: boolean; search?: string }): Observable<ConstructionStage[]> {
    this._loading.set(true);
    let httpParams = new HttpParams().set('paginate', 'false');

    if (params?.is_active !== undefined) {
      httpParams = httpParams.set('is_active', String(params.is_active));
    }
    if (params?.search && params.search.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    return this.http.get<ConstructionStage[]>(this.apiUrl, { params: httpParams }).pipe(
      tap((data) => this._stages.set(data)),
      finalize(() => this._loading.set(false))
    );
  }

  getStageById(id: number): Observable<ConstructionStage> {
    return this.http.get<ConstructionStage>(`${this.apiUrl}${id}/`).pipe(
      tap((stage) => this._selectedStage.set(stage))
    );
  }

  createStage(dto: CreateConstructionStageDto): Observable<ConstructionStage> {
    return this.http.post<ConstructionStage>(this.apiUrl, dto).pipe(
      tap({
        next: (created) => {
          this._stages.update((list) => [...list, created].sort((a, b) => a.order - b.order));
          this.toast.success(`Etapa "${created.name}" creada exitosamente.`);
        },
        error: () => this.toast.error('Error al registrar la etapa constructiva.'),
      })
    );
  }

  updateStage(id: number, dto: UpdateConstructionStageDto): Observable<ConstructionStage> {
    return this.http.patch<ConstructionStage>(`${this.apiUrl}${id}/`, dto).pipe(
      tap({
        next: (updated) => {
          this._stages.update((list) =>
            list.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.order - b.order)
          );
          this.toast.success(`Etapa "${updated.name}" actualizada.`);
        },
        error: () => this.toast.error('Error al actualizar la etapa constructiva.'),
      })
    );
  }

  deleteStage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap({
        next: () => {
          this._stages.update((list) => list.filter((s) => s.id !== id));
          this.toast.success('Etapa constructiva eliminada.');
        },
        error: () => this.toast.error('Error al eliminar la etapa constructiva.'),
      })
    );
  }
}
