import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProjectDocument,
  ProjectDocumentSummary,
  UploadProjectDocumentDto,
} from '../models/project-document.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectDocumentService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/core/project-documents/`;

  private readonly _documents = signal<ProjectDocument[]>([]);
  private readonly _summary = signal<ProjectDocumentSummary | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _uploading = signal<boolean>(false);

  readonly documents = this._documents.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly uploading = this._uploading.asReadonly();

  loadDocuments(projectId: number): Observable<ProjectDocument[]> {
    this._loading.set(true);
    const params = new HttpParams().set('project', projectId.toString());

    return this.http.get<ProjectDocument[]>(this.apiUrl, { params }).pipe(
      tap((docs) => {
        this._documents.set(docs);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  loadSummary(projectId: number): Observable<ProjectDocumentSummary> {
    const url = `${this.apiUrl}summary/`;
    const params = new HttpParams().set('project', projectId.toString());

    return this.http.get<ProjectDocumentSummary>(url, { params }).pipe(
      tap((sum) => {
        this._summary.set(sum);
      })
    );
  }

  uploadDocument(dto: UploadProjectDocumentDto): Observable<ProjectDocument> {
    this._uploading.set(true);
    const formData = new FormData();
    formData.append('project', dto.project.toString());
    formData.append('title', dto.title);
    formData.append('document_type', dto.document_type);
    formData.append('file', dto.file);

    if (dto.supplier_name) {
      formData.append('supplier_name', dto.supplier_name);
    }
    if (dto.quoted_amount !== null && dto.quoted_amount !== undefined) {
      formData.append('quoted_amount', dto.quoted_amount.toString());
    }
    if (dto.currency) {
      formData.append('currency', dto.currency);
    }
    if (dto.subcategory) {
      formData.append('subcategory', dto.subcategory.toString());
    }
    if (dto.notes) {
      formData.append('notes', dto.notes);
    }

    return this.http.post<ProjectDocument>(this.apiUrl, formData).pipe(
      tap((newDoc) => {
        this._documents.update((list) => [newDoc, ...list]);
        // Refrescar resumen
        this.loadSummary(dto.project).subscribe();
        this.toast.success(
          'Documento subido',
          `"${newDoc.title}" se adjuntó correctamente a la obra.`
        );
      }),
      finalize(() => this._uploading.set(false))
    );
  }

  deleteDocument(id: number, projectId: number): Observable<void> {
    this._loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => {
        const target = this._documents().find((d) => d.id === id);
        this._documents.update((list) => list.filter((d) => d.id !== id));
        this.loadSummary(projectId).subscribe();
        this.toast.success(
          'Documento eliminado',
          `"${target?.title || 'El documento'}" fue eliminado de la obra.`
        );
      }),
      finalize(() => this._loading.set(false))
    );
  }

  downloadDocument(doc: ProjectDocument): void {
    if (!doc.file_url) return;
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.file_name || doc.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
