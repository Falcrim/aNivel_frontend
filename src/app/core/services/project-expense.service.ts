import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateProjectExpenseDto,
  ProjectExpense,
  ProjectExpenseSummary,
} from '../models/project-expense.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectExpenseService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/project-expenses/`;

  private readonly _expenses = signal<ProjectExpense[]>([]);
  private readonly _summary = signal<ProjectExpenseSummary | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _submitting = signal<boolean>(false);

  readonly expenses = this._expenses.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly submitting = this._submitting.asReadonly();

  loadExpenses(
    projectId: number,
    categoryType?: string,
    rendicionNumber?: string
  ): Observable<ProjectExpense[]> {
    this._loading.set(true);
    let params = new HttpParams().set('project', projectId.toString());
    if (categoryType && categoryType !== 'all') {
      params = params.set('category_type', categoryType);
    }
    if (rendicionNumber && rendicionNumber !== 'all') {
      params = params.set('rendicion_number', rendicionNumber);
    }

    return this.http.get<ProjectExpense[]>(this.apiUrl, { params }).pipe(
      tap((data) => {
        this._expenses.set(data);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  loadSummary(projectId: number): Observable<ProjectExpenseSummary> {
    const url = `${this.apiUrl}summary/`;
    const params = new HttpParams().set('project', projectId.toString());

    return this.http.get<ProjectExpenseSummary>(url, { params }).pipe(
      tap((sum) => {
        this._summary.set(sum);
      })
    );
  }

  createExpense(dto: CreateProjectExpenseDto): Observable<ProjectExpense> {
    this._submitting.set(true);
    const formData = new FormData();
    formData.append('project', dto.project.toString());
    formData.append('category_type', dto.category_type);
    formData.append('item_name', dto.item_name);
    formData.append('unit_name', dto.unit_name);
    formData.append('quantity', dto.quantity.toString());
    formData.append('unit_price', dto.unit_price.toString());
    if (dto.total_price !== undefined && dto.total_price !== null) {
      formData.append('total_price', dto.total_price.toString());
    }
    formData.append('payment_status', dto.payment_status);
    formData.append('expense_date', dto.expense_date);

    if (dto.subcategory) {
      formData.append('subcategory', dto.subcategory.toString());
    }
    if (dto.payment_method) {
      formData.append('payment_method', dto.payment_method);
    }
    if (dto.supplier_name) {
      formData.append('supplier_name', dto.supplier_name);
    }
    if (dto.details) {
      formData.append('details', dto.details);
    }
    if (dto.rendicion_number) {
      formData.append('rendicion_number', dto.rendicion_number);
    }
    if (dto.receipt_number) {
      formData.append('receipt_number', dto.receipt_number);
    }
    if (dto.receipt_file) {
      formData.append('receipt_file', dto.receipt_file);
    }

    return this.http.post<ProjectExpense>(this.apiUrl, formData).pipe(
      tap((newExpense) => {
        this._expenses.update((list) => [newExpense, ...list]);
        this.loadSummary(dto.project).subscribe();
        this.toast.success(
          'Gasto registrado',
          `Se registró "${newExpense.item_name}" (Bs ${newExpense.total_price}) con éxito.`
        );
      }),
      finalize(() => this._submitting.set(false))
    );
  }

  deleteExpense(id: number, projectId: number): Observable<void> {
    this._loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._expenses().find((e) => e.id === id);
        this._expenses.update((list) => list.filter((e) => e.id !== id));
        this.loadSummary(projectId).subscribe();
        this.toast.success(
          'Gasto eliminado',
          `Se eliminó el registro "${target?.item_name || ''}".`
        );
      }),
      finalize(() => this._loading.set(false))
    );
  }
}
