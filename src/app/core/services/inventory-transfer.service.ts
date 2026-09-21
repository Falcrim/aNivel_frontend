import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateToolTransferDto, ToolTransfer } from '../models/inventory-transfer.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class InventoryTransferService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/inventory/transfers/`;

  private readonly _transfers = signal<ToolTransfer[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly transfers = this._transfers.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadTransfers(filters?: { tool?: number; project?: number; destination?: number }): Observable<ToolTransfer[]> {
    this._loading.set(true);
    let params = new HttpParams();
    if (filters?.tool) params = params.set('tool', filters.tool.toString());
    if (filters?.project) params = params.set('project', filters.project.toString());
    if (filters?.destination) params = params.set('destination', filters.destination.toString());

    return this.http.get<ToolTransfer[]>(this.apiUrl, { params }).pipe(
      tap((data) => this._transfers.set(data)),
      finalize(() => this._loading.set(false))
    );
  }

  createTransfer(dto: CreateToolTransferDto): Observable<ToolTransfer> {
    return this.http.post<ToolTransfer>(this.apiUrl, dto).pipe(
      tap((newTransfer) => {
        this._transfers.update((list) => [newTransfer, ...list]);
        this.toast.success(
          'Traslado exitoso',
          `Herramienta [${newTransfer.tool_code}] trasladada a "${newTransfer.destination_location_name}".`
        );
      })
    );
  }
}
