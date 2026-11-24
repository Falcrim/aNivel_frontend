import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, CreateSupplierDto, UpdateSupplierDto, SupplierType } from '../models/supplier.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/suppliers/`;

  private readonly _suppliers = signal<Supplier[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _selectedSupplier = signal<Supplier | null>(null);

  readonly suppliers = this._suppliers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selectedSupplier = this._selectedSupplier.asReadonly();

  loadSuppliers(type?: SupplierType | 'all', search?: string): Observable<Supplier[]> {
    this._loading.set(true);
    let params = new HttpParams().set('paginate', 'false');

    if (type && type !== 'all') {
      params = params.set('supplier_type', type);
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Supplier[]>(this.apiUrl, { params }).pipe(
      tap((data) => this._suppliers.set(data)),
      finalize(() => this._loading.set(false))
    );
  }

  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}${id}/`).pipe(
      tap((supplier) => this._selectedSupplier.set(supplier))
    );
  }

  createSupplier(dto: CreateSupplierDto): Observable<Supplier> {
    const formData = new FormData();
    formData.append('name', dto.name);
    formData.append('supplier_type', dto.supplier_type);
    if (dto.contact_name) formData.append('contact_name', dto.contact_name);
    if (dto.phone) formData.append('phone', dto.phone);
    if (dto.email) formData.append('email', dto.email);
    if (dto.address) formData.append('address', dto.address);
    if (dto.notes) formData.append('notes', dto.notes);
    if (dto.is_active !== undefined) formData.append('is_active', String(dto.is_active));
    if (dto.photo instanceof File) {
      formData.append('photo', dto.photo, dto.photo.name);
    }

    return this.http.post<Supplier>(this.apiUrl, formData).pipe(
      tap((newSupplier) => {
        this._suppliers.update((list) => [newSupplier, ...list]);
        this.toast.success('Proveedor creado', `El proveedor "${newSupplier.name}" fue registrado con éxito.`);
      })
    );
  }

  updateSupplier(id: number, dto: UpdateSupplierDto): Observable<Supplier> {
    const formData = new FormData();
    if (dto.name !== undefined) formData.append('name', dto.name);
    if (dto.supplier_type !== undefined) formData.append('supplier_type', dto.supplier_type);
    if (dto.contact_name !== undefined) formData.append('contact_name', dto.contact_name);
    if (dto.phone !== undefined) formData.append('phone', dto.phone);
    if (dto.email !== undefined) formData.append('email', dto.email);
    if (dto.address !== undefined) formData.append('address', dto.address);
    if (dto.notes !== undefined) formData.append('notes', dto.notes);
    if (dto.is_active !== undefined) formData.append('is_active', String(dto.is_active));
    if (dto.photo instanceof File) {
      formData.append('photo', dto.photo, dto.photo.name);
    }

    return this.http.patch<Supplier>(`${this.apiUrl}${id}/`, formData).pipe(
      tap((updated) => {
        this._suppliers.update((list) =>
          list.map((s) => (s.id === id ? updated : s))
        );
        this.toast.success('Proveedor actualizado', `Se actualizó "${updated.name}".`);
      })
    );
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._suppliers().find((s) => s.id === id);
        this._suppliers.update((list) => list.filter((s) => s.id !== id));
        this.toast.success('Proveedor eliminado', `El proveedor "${target?.name || ''}" fue eliminado.`);
      })
    );
  }
}
