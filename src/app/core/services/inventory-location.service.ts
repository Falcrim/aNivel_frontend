import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateLocationDto,
  InventoryLocation,
  UpdateLocationDto,
} from '../models/inventory-location.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class InventoryLocationService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/inventory/locations/`;

  private readonly _locations = signal<InventoryLocation[]>([]);
  private readonly _loading = signal<boolean>(false);

  readonly locations = this._locations.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadLocations(filters?: { location_type?: string; project?: number; is_active?: boolean }): Observable<InventoryLocation[]> {
    this._loading.set(true);
    let params = new HttpParams();
    if (filters?.location_type) params = params.set('location_type', filters.location_type);
    if (filters?.project) params = params.set('project', filters.project.toString());
    if (filters?.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());

    return this.http.get<InventoryLocation[]>(this.apiUrl, { params }).pipe(
      tap((data) => this._locations.set(data)),
      finalize(() => this._loading.set(false))
    );
  }

  createLocation(dto: CreateLocationDto): Observable<InventoryLocation> {
    return this.http.post<InventoryLocation>(this.apiUrl, dto).pipe(
      tap((newLoc) => {
        this._locations.update((list) => [...list, newLoc]);
        this.toast.success('Locación creada', `Se creó "${newLoc.name}" exitosamente.`);
      })
    );
  }

  updateLocation(id: number, dto: UpdateLocationDto): Observable<InventoryLocation> {
    return this.http.put<InventoryLocation>(`${this.apiUrl}${id}/`, dto).pipe(
      tap((updated) => {
        this._locations.update((list) =>
          list.map((loc) => (loc.id === id ? updated : loc))
        );
        this.toast.success('Locación actualizada', `Se actualizó "${updated.name}".`);
      })
    );
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._locations().find((loc) => loc.id === id);
        this._locations.update((list) => list.filter((loc) => loc.id !== id));
        this.toast.success('Locación eliminada', `Se eliminó "${target?.name || ''}".`);
      })
    );
  }
}
