import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectDocumentService } from '../../../../../core/services/project-document.service';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { ToastService } from '../../../../../core/services/toast.service';
import {
  DocumentCurrency,
  DocumentType,
  UploadProjectDocumentDto,
} from '../../../../../core/models/project-document.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import {
  CustomSelectComponent,
  CustomSelectOption,
} from '../../../../../shared/components/custom-select/custom-select.component';

const ALLOWED_EXTENSIONS = [
  'pdf',
  'xlsx',
  'xls',
  'csv',
  'docx',
  'doc',
  'png',
  'jpg',
  'jpeg',
  'webp',
];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

@Component({
  selector: 'app-upload-document-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent],
  templateUrl: './upload-document-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadDocumentModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly projectId = input.required<number>();
  readonly presetSubcategoryId = input<number | null>(null);

  readonly close = output<void>();
  readonly uploaded = output<void>();

  private readonly documentService = inject(ProjectDocumentService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly toast = inject(ToastService);

  readonly isDragging = signal<boolean>(false);
  readonly selectedFile = signal<File | null>(null);
  readonly title = signal<string>('');
  readonly documentType = signal<DocumentType>('quotation');
  readonly supplierName = signal<string>('');
  readonly quotedAmount = signal<number | null>(null);
  readonly currency = signal<DocumentCurrency>('BOB');
  readonly subcategoryId = signal<number | null>(null);
  readonly notes = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);

  readonly typeOptions: CustomSelectOption<DocumentType>[] = [
    { label: 'Cotización / Proforma de Presupuesto', value: 'quotation' },
    { label: 'Ficha Técnica / Certificado', value: 'technical_sheet' },
    { label: 'Plano / Especificación', value: 'blueprint' },
    { label: 'Otro Respaldo de Presupuesto', value: 'other' },
  ];

  readonly currencyOptions: CustomSelectOption<DocumentCurrency>[] = [
    { label: 'Bolivianos (Bs)', value: 'BOB' },
    { label: 'Dólares ($)', value: 'USD' },
  ];

  readonly subcategoryOptions = computed<CustomSelectOption<number | null>[]>(() => {
    const subcats = this.subcategoryService.subcategories();
    const list: CustomSelectOption<number | null>[] = [
      {
        label: 'General de la Obra',
        subtitle: 'Sin etapa o subcategoría específica',
        value: null,
      },
    ];
    for (const s of subcats) {
      list.push({
        label: s.name,
        subtitle: s.category_name ? `Categoría: ${s.category_name}` : undefined,
        value: s.id,
      });
    }
    return list;
  });

  readonly formattedFileSize = computed(() => {
    const f = this.selectedFile();
    if (!f) return '';
    const bytes = f.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const presetSubcat = this.presetSubcategoryId();
      if (open) {
        untracked(() => {
          this.resetForm();
          if (presetSubcat) {
            this.subcategoryId.set(presetSubcat);
          }
        });
      }
    });
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileChange(e: Event): void {
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      this.handleFile(inputEl.files[0]);
    }
  }

  private handleFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      this.toast.error(
        'Formato no permitido',
        `El archivo .${ext} no es válido. Formatos soportados: ${ALLOWED_EXTENSIONS.join(', ')}.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.toast.error(
        'Archivo demasiado pesado',
        `El archivo supera el límite de 25 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
      );
      return;
    }

    this.selectedFile.set(file);
    if (!this.title().trim()) {
      // Remover extensión para título por defecto
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      this.title.set(baseName);
    }
  }

  removeSelectedFile(): void {
    this.selectedFile.set(null);
  }

  resetForm(): void {
    this.selectedFile.set(null);
    this.title.set('');
    this.documentType.set('quotation');
    this.supplierName.set('');
    this.quotedAmount.set(null);
    this.currency.set('BOB');
    this.subcategoryId.set(null);
    this.notes.set('');
    this.isSubmitting.set(false);
    this.isDragging.set(false);
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file) {
      this.toast.error('Archivo requerido', 'Por favor selecciona o arrastra un archivo.');
      return;
    }

    const titleVal = this.title().trim() || file.name;
    const dto: UploadProjectDocumentDto = {
      project: this.projectId(),
      title: titleVal,
      document_type: this.documentType(),
      file: file,
      supplier_name: this.supplierName().trim() || undefined,
      quoted_amount: this.quotedAmount() !== null ? Number(this.quotedAmount()) : null,
      currency: this.currency(),
      subcategory: this.subcategoryId(),
      notes: this.notes().trim() || undefined,
    };

    this.isSubmitting.set(true);
    this.documentService.uploadDocument(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.uploaded.emit();
        this.closeModal();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.error('Error al subir', 'No se pudo subir el archivo. Intenta de nuevo.');
      },
    });
  }

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }
}
