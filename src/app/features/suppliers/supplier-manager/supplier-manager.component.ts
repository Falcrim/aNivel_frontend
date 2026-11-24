import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier, SupplierType, CreateSupplierDto, UpdateSupplierDto } from '../../../core/models/supplier.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { InfoTooltipComponent } from '../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-supplier-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmDialogComponent, EmptyStateComponent, InfoTooltipComponent],
  templateUrl: './supplier-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierManagerComponent implements OnInit {
  protected readonly supplierService = inject(SupplierService);

  // Filtros y Búsqueda
  readonly activeTypeFilter = signal<SupplierType | 'all'>('all');
  readonly searchTerm = signal<string>('');

  // Modales
  readonly isModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly isProcessing = signal(false);

  // Entidades activas para edición/eliminación
  readonly supplierToEdit = signal<Supplier | null>(null);
  readonly supplierToDelete = signal<Supplier | null>(null);

  // Formulario reactivo
  readonly formName = signal('');
  readonly formType = signal<SupplierType>('material');
  readonly formContact = signal('');
  readonly formPhone = signal('');
  readonly formEmail = signal('');
  readonly formAddress = signal('');
  readonly formNotes = signal('');
  readonly formPhotoFile = signal<File | null>(null);
  readonly formPhotoPreview = signal<string | null>(null);

  // Métricas agregadas en tiempo real
  readonly totalCount = computed(() => this.supplierService.suppliers().length);
  readonly materialCount = computed(() =>
    this.supplierService.suppliers().filter((s) => s.supplier_type === 'material').length
  );
  readonly laborCount = computed(() =>
    this.supplierService.suppliers().filter((s) => s.supplier_type === 'labor').length
  );
  readonly bothCount = computed(() =>
    this.supplierService.suppliers().filter((s) => s.supplier_type === 'both').length
  );

  // Lista filtrada reactivamente
  readonly filteredSuppliers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const typeFilter = this.activeTypeFilter();
    let list = this.supplierService.suppliers();

    if (typeFilter !== 'all') {
      list = list.filter((s) => s.supplier_type === typeFilter);
    }

    if (!term) return list;

    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.contact_name && s.contact_name.toLowerCase().includes(term)) ||
        (s.phone && s.phone.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.address && s.address.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void {
    this.supplierService.loadSuppliers().subscribe();
  }

  // --- Handlers de Modales ---

  openCreateModal(): void {
    this.modalMode.set('create');
    this.supplierToEdit.set(null);
    this.formName.set('');
    this.formType.set('material');
    this.formContact.set('');
    this.formPhone.set('');
    this.formEmail.set('');
    this.formAddress.set('');
    this.formNotes.set('');
    this.formPhotoFile.set(null);
    this.formPhotoPreview.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(supplier: Supplier): void {
    this.modalMode.set('edit');
    this.supplierToEdit.set(supplier);
    this.formName.set(supplier.name);
    this.formType.set(supplier.supplier_type);
    this.formContact.set(supplier.contact_name || '');
    this.formPhone.set(supplier.phone || '');
    this.formEmail.set(supplier.email || '');
    this.formAddress.set(supplier.address || '');
    this.formNotes.set(supplier.notes || '');
    this.formPhotoFile.set(null);
    this.formPhotoPreview.set(supplier.photo_url || null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.supplierToEdit.set(null);
    this.formPhotoFile.set(null);
    this.formPhotoPreview.set(null);
  }

  openDeleteModal(supplier: Supplier): void {
    this.supplierToDelete.set(supplier);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.supplierToDelete.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.formPhotoFile.set(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.formPhotoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.formPhotoFile.set(null);
    this.formPhotoPreview.set(null);
  }

  submitForm(): void {
    if (!this.formName().trim()) return;

    this.isProcessing.set(true);

    if (this.modalMode() === 'create') {
      const dto: CreateSupplierDto = {
        name: this.formName().trim(),
        supplier_type: this.formType(),
        contact_name: this.formContact().trim() || undefined,
        phone: this.formPhone().trim() || undefined,
        email: this.formEmail().trim() || undefined,
        address: this.formAddress().trim() || undefined,
        notes: this.formNotes().trim() || undefined,
        photo: this.formPhotoFile(),
      };

      this.supplierService.createSupplier(dto).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeModal();
        },
        error: () => this.isProcessing.set(false),
      });
    } else {
      const target = this.supplierToEdit();
      if (!target) return;

      const dto: UpdateSupplierDto = {
        name: this.formName().trim(),
        supplier_type: this.formType(),
        contact_name: this.formContact().trim() || undefined,
        phone: this.formPhone().trim() || undefined,
        email: this.formEmail().trim() || undefined,
        address: this.formAddress().trim() || undefined,
        notes: this.formNotes().trim() || undefined,
        photo: this.formPhotoFile() || undefined,
      };

      this.supplierService.updateSupplier(target.id, dto).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeModal();
        },
        error: () => this.isProcessing.set(false),
      });
    }
  }

  submitDelete(): void {
    const target = this.supplierToDelete();
    if (!target) return;

    this.isProcessing.set(true);
    this.supplierService.deleteSupplier(target.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeDeleteModal();
      },
      error: () => this.isProcessing.set(false),
    });
  }

  getWhatsAppLink(phone?: string): string {
    if (!phone) return '#';
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/591${cleanNumber}`;
  }
}
