import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnitOfMeasureService } from '../../../core/services/unit-of-measure.service';
import { PurchaseUnitService } from '../../../core/services/purchase-unit.service';
import { UnitOfMeasure } from '../../../core/models/unit-of-measure.model';
import { PurchaseUnit } from '../../../core/models/purchase-unit.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-units-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmDialogComponent],
  templateUrl: './units-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitsManagerComponent implements OnInit {
  protected readonly uomService = inject(UnitOfMeasureService);
  protected readonly puService = inject(PurchaseUnitService);

  activeTab = signal<'uom' | 'pu'>('uom');
  searchTerm = signal<string>('');

  // Modals state
  isModalOpen = signal(false);
  isDeleteModalOpen = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  isProcessing = signal(false);

  // Form state
  unitName = signal<string>('');
  unitAbbreviation = signal<string>('');
  selectedUom = signal<UnitOfMeasure | null>(null);
  selectedPu = signal<PurchaseUnit | null>(null);

  // Filtered UoM
  filteredUom = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.uomService.units();
    if (!term) return list;
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.abbreviation.toLowerCase().includes(term)
    );
  });

  // Filtered PU
  filteredPu = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.puService.units();
    if (!term) return list;
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.abbreviation.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.uomService.loadUnits().subscribe();
    this.puService.loadUnits().subscribe();
  }

  // --- Create / Edit ---
  openCreateModal(): void {
    this.modalMode.set('create');
    this.unitName.set('');
    this.unitAbbreviation.set('');
    this.selectedUom.set(null);
    this.selectedPu.set(null);
    this.isModalOpen.set(true);
  }

  openEditUomModal(uom: UnitOfMeasure): void {
    this.modalMode.set('edit');
    this.selectedUom.set(uom);
    this.unitName.set(uom.name);
    this.unitAbbreviation.set(uom.abbreviation);
    this.isModalOpen.set(true);
  }

  openEditPuModal(pu: PurchaseUnit): void {
    this.modalMode.set('edit');
    this.selectedPu.set(pu);
    this.unitName.set(pu.name);
    this.unitAbbreviation.set(pu.abbreviation);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  submitForm(): void {
    const name = this.unitName().trim();
    const abbreviation = this.unitAbbreviation().trim();
    if (!name || !abbreviation) return;

    this.isProcessing.set(true);

    if (this.activeTab() === 'uom') {
      if (this.modalMode() === 'create') {
        this.uomService.createUnit({ name, abbreviation }).subscribe({
          next: () => {
            this.isProcessing.set(false);
            this.closeModal();
          },
          error: () => this.isProcessing.set(false),
        });
      } else {
        const uom = this.selectedUom();
        if (!uom) return;
        this.uomService.updateUnit(uom.id, { name, abbreviation }).subscribe({
          next: () => {
            this.isProcessing.set(false);
            this.closeModal();
          },
          error: () => this.isProcessing.set(false),
        });
      }
    } else {
      if (this.modalMode() === 'create') {
        this.puService.createUnit({ name, abbreviation }).subscribe({
          next: () => {
            this.isProcessing.set(false);
            this.closeModal();
          },
          error: () => this.isProcessing.set(false),
        });
      } else {
        const pu = this.selectedPu();
        if (!pu) return;
        this.puService.updateUnit(pu.id, { name, abbreviation }).subscribe({
          next: () => {
            this.isProcessing.set(false);
            this.closeModal();
          },
          error: () => this.isProcessing.set(false),
        });
      }
    }
  }

  // --- Delete ---
  openDeleteUomModal(uom: UnitOfMeasure): void {
    this.selectedUom.set(uom);
    this.isDeleteModalOpen.set(true);
  }

  openDeletePuModal(pu: PurchaseUnit): void {
    this.selectedPu.set(pu);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedUom.set(null);
    this.selectedPu.set(null);
  }

  submitDelete(): void {
    this.isProcessing.set(true);
    if (this.activeTab() === 'uom') {
      const uom = this.selectedUom();
      if (!uom) return;
      this.uomService.deleteUnit(uom.id).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeDeleteModal();
        },
        error: () => this.isProcessing.set(false),
      });
    } else {
      const pu = this.selectedPu();
      if (!pu) return;
      this.puService.deleteUnit(pu.id).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeDeleteModal();
        },
        error: () => this.isProcessing.set(false),
      });
    }
  }
}
