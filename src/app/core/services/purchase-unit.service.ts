import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePurchaseUnitDto, PurchaseUnit, UpdatePurchaseUnitDto } from '../models/purchase-unit.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class PurchaseUnitService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/purchase-units/`;

  private readonly _units = signal<PurchaseUnit[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly units = this._units.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadUnits(): Observable<PurchaseUnit[]> {
    this._loading.set(true);
    return this.http.get<PurchaseUnit[]>(this.apiUrl).pipe(
      tap((data) => {
        this._units.set(data);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  createUnit(dto: CreatePurchaseUnitDto): Observable<PurchaseUnit> {
    return this.http.post<PurchaseUnit>(this.apiUrl, dto).pipe(
      tap((newUnit) => {
        this._units.update((list) => [...list, newUnit]);
        this.toast.success('Unidad de compra creada', `"${newUnit.name}" (${newUnit.abbreviation}) agregada.`);
      })
    );
  }

  updateUnit(id: number, dto: UpdatePurchaseUnitDto): Observable<PurchaseUnit> {
    return this.http.put<PurchaseUnit>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._units.update((list) =>
          list.map((u) => (u.id === id ? updated : u))
        );
        this.toast.success('Unidad actualizada', `Se actualizó a "${updated.name}".`);
      })
    );
  }

  deleteUnit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._units().find((u) => u.id === id);
        this._units.update((list) => list.filter((u) => u.id !== id));
        this.toast.success('Unidad eliminada', `"${target?.name || ''}" fue eliminada.`);
      })
    );
  }
}
