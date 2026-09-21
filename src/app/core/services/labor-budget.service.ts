import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LaborBudgetItem,
  LaborBudgetSummary,
  LaborGroupedBudget,
  FromLaborCatalogDto,
  CustomLaborBudgetItemDto,
  UpdateLaborBudgetItemDto,
} from '../models/labor-budget.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class LaborBudgetService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/labor/budget/`;

  private readonly _items = signal<LaborBudgetItem[]>([]);
  private readonly _summary = signal<LaborBudgetSummary | null>(null);
  private readonly _groupedBudget = signal<LaborGroupedBudget | null>(null);
  private readonly _loading = signal<boolean>(false);

  readonly items = this._items.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly groupedBudget = this._groupedBudget.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadBudgetByProject(projectId: number): Observable<LaborGroupedBudget> {
    this._loading.set(true);
    return this.http
      .get<LaborGroupedBudget>(`${this.apiUrl}by-project/?project_id=${projectId}`)
      .pipe(
        tap((data) => {
          this._groupedBudget.set(data);
          const allItems: LaborBudgetItem[] = [];
          data.groups.forEach((g) => allItems.push(...g.items));
          this._items.set(allItems);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  loadBudgetSummary(projectId: number): Observable<LaborBudgetSummary> {
    return this.http
      .get<LaborBudgetSummary>(`${this.apiUrl}summary/?project_id=${projectId}`)
      .pipe(
        tap((data) => this._summary.set(data))
      );
  }

  createFromCatalog(dto: FromLaborCatalogDto): Observable<LaborBudgetItem> {
    return this.http.post<LaborBudgetItem>(`${this.apiUrl}from-catalog/`, dto).pipe(
      tap((item) => {
        this.toast.success('Tarea agregada', `Se agregó "${item.name}" al presupuesto de mano de obra.`);
      })
    );
  }

  createCustomItem(dto: CustomLaborBudgetItemDto): Observable<LaborBudgetItem> {
    return this.http.post<LaborBudgetItem>(`${this.apiUrl}custom/`, dto).pipe(
      tap((item) => {
        this.toast.success('Tarea personalizada', `Se creó "${item.name}" correctamente.`);
      })
    );
  }

  updateBudgetItem(id: number, dto: UpdateLaborBudgetItemDto): Observable<LaborBudgetItem> {
    return this.http.put<LaborBudgetItem>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((item) => {
        this.toast.success('Tarea actualizada', `Se modificó "${item.name}" correctamente.`);
      })
    );
  }

  deleteBudgetItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        this.toast.success('Tarea eliminada', 'La tarea se eliminó del presupuesto.');
      })
    );
  }
}
