import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CustomBudgetItemPayload,
  FromCatalogGlobalPayload,
  FromCatalogPayload,
  MaterialBudgetItem,
  ProjectBudgetGroupedResponse,
  ProjectBudgetSummaryResponse,
} from '../models/material-budget.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class MaterialBudgetService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/materials/budget/`;

  private readonly _groupedBudget = signal<ProjectBudgetGroupedResponse | null>(null);
  private readonly _summary = signal<ProjectBudgetSummaryResponse | null>(null);
  private readonly _items = signal<MaterialBudgetItem[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly groupedBudget = this._groupedBudget.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadBudgetByProject(projectId: number): Observable<ProjectBudgetGroupedResponse> {
    this._loading.set(true);
    const params = new HttpParams().set('project_id', projectId.toString());

    return this.http
      .get<ProjectBudgetGroupedResponse>(`${this.apiUrl}by-project/`, { params })
      .pipe(
        tap((data) => {
          this._groupedBudget.set(data);
          const allItems: MaterialBudgetItem[] = [];
          data.groups.forEach((g) => allItems.push(...g.items));
          this._items.set(allItems);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  loadBudgetSummary(projectId: number): Observable<ProjectBudgetSummaryResponse> {
    const params = new HttpParams().set('project_id', projectId.toString());

    return this.http
      .get<ProjectBudgetSummaryResponse>(`${this.apiUrl}summary/`, { params })
      .pipe(
        tap((data) => {
          this._summary.set(data);
        })
      );
  }

  addFromCatalog(payload: FromCatalogPayload): Observable<MaterialBudgetItem> {
    return this.http
      .post<MaterialBudgetItem>(`${this.apiUrl}from-catalog/`, payload)
      .pipe(
        tap((item) => {
          this.toast.success(
            'Material vinculado a la obra',
            `"${item.name}" fue agregado al presupuesto con ${item.quantity_purchase} ${item.unit_purchase_detail?.abbreviation || 'unidades'}.`
          );
        })
      );
  }

  addFromCatalogGlobal(payload: FromCatalogGlobalPayload): Observable<MaterialBudgetItem> {
    return this.http
      .post<MaterialBudgetItem>(`${this.apiUrl}from-catalog-global/`, payload)
      .pipe(
        tap((item) => {
          this.toast.success(
            'Ítem global vinculado',
            `"${item.name}" fue agregado como compra en paquete al presupuesto.`
          );
        })
      );
  }

  addCustomItem(payload: CustomBudgetItemPayload): Observable<MaterialBudgetItem> {
    return this.http
      .post<MaterialBudgetItem>(`${this.apiUrl}custom/`, payload)
      .pipe(
        tap((item) => {
          this.toast.success(
            'Ítem personalizado creado',
            `"${item.name}" fue creado directamente en la obra.`
          );
        })
      );
  }

  updateBudgetItem(id: number, data: Partial<MaterialBudgetItem>): Observable<MaterialBudgetItem> {
    return this.http.patch<MaterialBudgetItem>(`${this.apiUrl}${id}/`, data).pipe(
      tap((updated) => {
        this.toast.success('Línea actualizada', `Se actualizaron los datos de "${updated.name}".`);
      })
    );
  }

  deleteBudgetItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        this.toast.success('Ítem eliminado', 'El ítem fue eliminado del presupuesto de la obra.');
      })
    );
  }
}
