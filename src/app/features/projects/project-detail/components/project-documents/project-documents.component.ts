import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectDocumentService } from '../../../../../core/services/project-document.service';
import { ProjectDocument } from '../../../../../core/models/project-document.model';
import { CurrencyClpPipe, UsdPipe } from '../../../../../shared/pipes/currency-clp.pipe';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UploadDocumentModalComponent } from '../upload-document-modal/upload-document-modal.component';
import { DocumentPreviewModalComponent } from '../document-preview-modal/document-preview-modal.component';

@Component({
  selector: 'app-project-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyClpPipe,
    UsdPipe,
    ConfirmDialogComponent,
    UploadDocumentModalComponent,
    DocumentPreviewModalComponent,
  ],
  templateUrl: './project-documents.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDocumentsComponent implements OnInit {
  readonly projectId = input.required<number>();
  readonly countChanged = output<number>();

  protected readonly documentService = inject(ProjectDocumentService);

  readonly searchTerm = signal<string>('');
  readonly selectedTypeFilter = signal<string>('all');

  readonly isUploadModalOpen = signal<boolean>(false);
  readonly isPreviewModalOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly selectedDocForPreview = signal<ProjectDocument | null>(null);
  readonly selectedDocForDelete = signal<ProjectDocument | null>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly filteredDocuments = computed<ProjectDocument[]>(() => {
    const list = this.documentService.documents();
    const term = this.searchTerm().toLowerCase().trim();
    const typeFilter = this.selectedTypeFilter();

    return list.filter((doc) => {
      // Filtro por tipo
      if (typeFilter !== 'all' && doc.document_type !== typeFilter) {
        return false;
      }
      // Filtro por búsqueda
      if (!term) return true;

      const titleMatch = doc.title.toLowerCase().includes(term);
      const nameMatch = doc.file_name.toLowerCase().includes(term);
      const supplierMatch = doc.supplier_name?.toLowerCase().includes(term) ?? false;
      const subcatMatch = doc.subcategory_name?.toLowerCase().includes(term) ?? false;
      const notesMatch = doc.notes?.toLowerCase().includes(term) ?? false;

      return titleMatch || nameMatch || supplierMatch || subcatMatch || notesMatch;
    });
  });

  constructor() {
    effect(() => {
      const pid = this.projectId();
      if (pid) {
        this.loadData(pid);
      }
    });

    effect(() => {
      const count = this.documentService.documents().length;
      this.countChanged.emit(count);
    });
  }

  ngOnInit(): void {
    const pid = this.projectId();
    if (pid) {
      this.loadData(pid);
    }
  }

  loadData(pid: number): void {
    this.documentService.loadDocuments(pid).subscribe();
    this.documentService.loadSummary(pid).subscribe();
  }

  setTypeFilter(filter: string): void {
    this.selectedTypeFilter.set(filter);
  }

  openUploadModal(): void {
    this.isUploadModalOpen.set(true);
  }

  openPreview(doc: ProjectDocument): void {
    this.selectedDocForPreview.set(doc);
    this.isPreviewModalOpen.set(true);
  }

  closePreview(): void {
    this.isPreviewModalOpen.set(false);
    this.selectedDocForPreview.set(null);
  }

  openDelete(doc: ProjectDocument): void {
    this.selectedDocForDelete.set(doc);
    this.isDeleteModalOpen.set(true);
  }

  closeDelete(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedDocForDelete.set(null);
  }

  confirmDelete(): void {
    const doc = this.selectedDocForDelete();
    if (!doc) return;

    this.isDeleting.set(true);
    this.documentService.deleteDocument(doc.id, this.projectId()).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDelete();
      },
      error: () => {
        this.isDeleting.set(false);
      },
    });
  }

  downloadDocument(doc: ProjectDocument): void {
    this.documentService.downloadDocument(doc);
  }

  getFileBadgeClass(ext: string): string {
    const e = ext.toLowerCase();
    if (e === 'pdf') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (['xlsx', 'xls', 'csv'].includes(e)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (['docx', 'doc'].includes(e)) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(e)) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
