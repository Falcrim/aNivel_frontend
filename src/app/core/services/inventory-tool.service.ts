import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateToolDto, Tool, ToolStatus, UpdateToolDto } from '../models/inventory-tool.model';
import { ToolTransfer } from '../models/inventory-transfer.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class InventoryToolService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/inventory/tools/`;

  private readonly _tools = signal<Tool[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly tools = this._tools.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadTools(filters?: {
    location?: number;
    project?: number;
    status?: string;
    category?: number;
    is_active?: boolean;
    search?: string;
  }): Observable<Tool[]> {
    this._loading.set(true);
    let params = new HttpParams();
    if (filters?.location) params = params.set('location', filters.location.toString());
    if (filters?.project) params = params.set('project', filters.project.toString());
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.category) params = params.set('category', filters.category.toString());
    if (filters?.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<Tool[]>(this.apiUrl, { params }).pipe(
      tap((data) => this._tools.set(data)),
      finalize(() => this._loading.set(false))
    );
  }

  createTool(dto: CreateToolDto): Observable<Tool> {
    return this.http.post<Tool>(this.apiUrl, dto).pipe(
      tap((newTool) => {
        this._tools.update((list) => [newTool, ...list]);
        this.toast.success('Herramienta registrada', `[${newTool.code}] ${newTool.name} fue guardada exitosamente.`);
      })
    );
  }

  updateTool(id: number, dto: UpdateToolDto): Observable<Tool> {
    return this.http.put<Tool>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._tools.update((list) =>
          list.map((t) => (t.id === id ? updated : t))
        );
        this.toast.success('Herramienta actualizada', `[${updated.code}] ${updated.name} fue actualizada.`);
      })
    );
  }

  updateStatus(id: number, status: ToolStatus, forceActive: boolean = false): Observable<Tool> {
    const payload: { status: ToolStatus; is_active?: boolean } = { status };
    if (status === 'MAINTENANCE' || forceActive) {
      payload.is_active = true;
    }

    return this.http.patch<Tool>(`${this.apiUrl}${id}/`, payload).pipe(
      tap((updated) => {
        this._tools.update((list) =>
          list.map((t) => (t.id === id ? updated : t))
        );
        this.toast.info('Estado actualizado', `Herramienta [${updated.code}] cambió a "${updated.status_display}".`);
      })
    );
  }

  toggleActive(id: number, currentActive: boolean): Observable<Tool> {
    const is_active = !currentActive;
    return this.http.patch<Tool>(`${this.apiUrl}${id}/`, { is_active }).pipe(
      tap((updated) => {
        this._tools.update((list) =>
          list.map((t) => (t.id === id ? updated : t))
        );
        const msg = is_active ? 'activada' : 'desactivada';
        this.toast.info('Estado de activo', `Herramienta [${updated.code}] fue ${msg}.`);
      })
    );
  }

  deleteTool(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._tools().find((t) => t.id === id);
        this._tools.update((list) => list.filter((t) => t.id !== id));
        this.toast.success('Herramienta eliminada', `[${target?.code || ''}] fue eliminada del inventario.`);
      })
    );
  }

  getToolHistory(id: number): Observable<ToolTransfer[]> {
    return this.http.get<ToolTransfer[]>(`${this.apiUrl}${id}/history/`);
  }

  // Refresca una sola herramienta tras un traslado
  refreshTool(updatedTool: Tool): void {
    this._tools.update((list) =>
      list.map((t) => (t.id === updatedTool.id ? updatedTool : t))
    );
  }
}
