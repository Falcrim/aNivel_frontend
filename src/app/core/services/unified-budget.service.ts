import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BudgetItem,
  BudgetItemGrouped,
  BudgetStageGrouped,
  BudgetSummary,
  BudgetItemCreatePayload,
  BudgetCategoryType,
} from '../models/budget-item.model';
import { ToastService } from './toast.service';

export interface FromCatalogUnifiedPayload {
  project: number;
  catalog_type: 'materials' | 'labor';
  catalog_id: number;
  stage?: number | null;
  subcategory?: number | null;
  quantity_obra?: number | null;
  quantity_purchase?: number | null;
  price_override?: number | null;
  waste_pct?: number | null;
  contractor_name?: string;
  detail?: string;
  apply_ceil?: boolean;
  is_global?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UnifiedBudgetService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/budget-items`;

  private readonly _items = signal<BudgetItem[]>([]);
  private readonly _groupedItems = signal<BudgetItemGrouped[]>([]);
  private readonly _stagesGrouped = signal<BudgetStageGrouped[]>([]);
  private readonly _summary = signal<BudgetSummary | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  readonly items = this._items.asReadonly();
  readonly groupedItems = this._groupedItems.asReadonly();
  readonly stagesGrouped = this._stagesGrouped.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loading = this._isLoading.asReadonly();

  /**
   * Carga el presupuesto agrupado en jerarquía de 2 niveles:
   * Etapa Constructiva -> Subcategorías -> Partidas.
   */
  loadGroupedByStage(projectId: number, categoryType?: BudgetCategoryType): Observable<BudgetStageGrouped[]> {
    this._isLoading.set(true);
    let params = new HttpParams().set('project', projectId.toString());
    if (categoryType) {
      params = params.set('category_type', categoryType);
    }

    return this.http.get<BudgetStageGrouped[]>(`${this.apiUrl}/by-stage/`, { params }).pipe(
      tap({
        next: (stages) => {
          this._stagesGrouped.set(stages);
          this._isLoading.set(false);
        },
        error: () => this._isLoading.set(false),
      })
    );
  }

  /**
   * Carga el presupuesto agrupado por subcategoría para alimentar el acordeón.
   */
  loadGrouped(projectId: number, categoryType?: BudgetCategoryType): Observable<BudgetItemGrouped[]> {
    this._isLoading.set(true);
    let params = new HttpParams().set('project', projectId.toString());
    if (categoryType) {
      params = params.set('category_type', categoryType);
    }

    return this.http.get<BudgetItemGrouped[]>(`${this.apiUrl}/by-project/`, { params }).pipe(
      tap({
        next: (groups) => {
          this._groupedItems.set(groups);
          this._isLoading.set(false);
        },
        error: () => this._isLoading.set(false),
      })
    );
  }

  /**
   * Carga la lista plana de partidas con filtros opcionales.
   */
  loadItems(projectId: number, filters?: { category_type?: BudgetCategoryType; stage?: number | null }): Observable<BudgetItem[]> {
    this._isLoading.set(true);
    let params = new HttpParams().set('project', projectId.toString()).set('paginate', 'false');
    if (filters?.category_type) {
      params = params.set('category_type', filters.category_type);
    }
    if (filters?.stage) {
      params = params.set('stage', filters.stage.toString());
    }

    return this.http.get<BudgetItem[]>(`${this.apiUrl}/`, { params }).pipe(
      tap({
        next: (data) => {
          this._items.set(data);
          this._isLoading.set(false);
        },
        error: () => this._isLoading.set(false),
      })
    );
  }

  /**
   * Carga el resumen financiero consolidado por familias de costo.
   */
  loadSummary(projectId: number): Observable<BudgetSummary> {
    const params = new HttpParams().set('project', projectId.toString());
    return this.http.get<BudgetSummary>(`${this.apiUrl}/summary/`, { params }).pipe(
      tap((res) => this._summary.set(res))
    );
  }

  /**
   * Crea una nueva partida presupuestaria.
   */
  createItem(payload: BudgetItemCreatePayload): Observable<BudgetItem> {
    return this.http.post<BudgetItem>(`${this.apiUrl}/`, payload).pipe(
      tap((created) => {
        this.toast.success('Partida registrada', `"${created.name}" se agregó al presupuesto.`);
      })
    );
  }

  /**
   * Actualiza una partida existente (permite moverla de subcategoría o etapa).
   */
  updateItem(id: number, patch: Partial<BudgetItem>): Observable<BudgetItem> {
    return this.http.patch<BudgetItem>(`${this.apiUrl}/${id}/`, patch).pipe(
      tap((updated) => {
        this.toast.success('Partida actualizada', `Se guardaron los cambios en "${updated.name}".`);
      })
    );
  }

  /**
   * Elimina una partida presupuestaria.
   */
  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`).pipe(
      tap(() => {
        this.toast.success('Partida eliminada', 'La línea fue removida del presupuesto.');
      })
    );
  }

  /**
   * Instancia una partida a partir de un catálogo maestro (Materiales o Mano de Obra).
   */
  createFromCatalog(payload: FromCatalogUnifiedPayload): Observable<BudgetItem> {
    return this.http.post<BudgetItem>(`${this.apiUrl}/from-catalog/`, payload).pipe(
      tap((created) => {
        this.toast.success('Vinculado desde catálogo', `"${created.name}" fue incorporado a la obra.`);
      })
    );
  }
}
