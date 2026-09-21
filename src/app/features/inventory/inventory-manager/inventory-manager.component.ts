import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryToolService } from '../../../core/services/inventory-tool.service';
import { InventoryLocationService } from '../../../core/services/inventory-location.service';
import { InventoryToolCategoryService } from '../../../core/services/inventory-tool-category.service';
import { InventoryTransferService } from '../../../core/services/inventory-transfer.service';
import { ProjectService } from '../../../core/services/project.service';
import { Tool, ToolStatus } from '../../../core/models/inventory-tool.model';
import {
  InventoryLocation,
  LocationType,
} from '../../../core/models/inventory-location.model';
import { ToolCategory } from '../../../core/models/inventory-tool-category.model';
import { ToolTransfer } from '../../../core/models/inventory-transfer.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-inventory-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    CustomSelectComponent,
  ],
  templateUrl: './inventory-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryManagerComponent implements OnInit {
  protected readonly toolService = inject(InventoryToolService);
  protected readonly locationService = inject(InventoryLocationService);
  protected readonly categoryService = inject(InventoryToolCategoryService);
  protected readonly transferService = inject(InventoryTransferService);
  protected readonly projectService = inject(ProjectService);

  // Tabs
  activeTab = signal<'tools' | 'locations' | 'categories' | 'transfers'>('tools');

  // Search and Filters for Tools
  searchTerm = signal<string>('');
  selectedStatusFilter = signal<string>('ALL');
  selectedLocationFilter = signal<string>('ALL');
  selectedCategoryFilter = signal<string>('ALL');

  // Select Options (Computed & Static)
  readonly categoryOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: '-- Sin categoría --', value: null },
    ...this.categoryService.categories().map((c) => ({
      label: c.name,
      value: c.id,
    })),
  ]);

  readonly locationOptions = computed<CustomSelectOption<number | null>[]>(() =>
    this.locationService.locations().map((l) => ({
      label: l.name,
      value: l.id,
      icon: l.location_type === 'PROJECT' ? '🏗️' : l.location_type === 'WORKSHOP' ? '🔧' : '🏬',
      subtitle: l.address || undefined,
    }))
  );

  readonly destinationLocationOptions = computed<CustomSelectOption<number | null>[]>(() => {
    const currentLocId = this.transferTool()?.current_location;
    return this.locationService
      .locations()
      .filter((l) => l.id !== currentLocId && l.is_active)
      .map((l) => ({
        label: l.name,
        value: l.id,
        icon: l.location_type === 'PROJECT' ? '🏗️' : l.location_type === 'WORKSHOP' ? '🔧' : '🏬',
        subtitle: l.address || undefined,
      }));
  });

  readonly statusOptions: CustomSelectOption<ToolStatus>[] = [
    { label: 'Disponible en Almacén', value: 'AVAILABLE', icon: '🟢' },
    { label: 'En Uso en Obra', value: 'IN_USE', icon: '🟡' },
    { label: 'En Mantenimiento / Reparación', value: 'MAINTENANCE', icon: '🟠' },
    { label: 'Dañada / Fuera de Servicio', value: 'DAMAGED', icon: '🔴' },
    { label: 'Extraviada / De Baja', value: 'LOST', icon: '⚪' },
  ];

  readonly locationTypeOptions: CustomSelectOption<LocationType>[] = [
    { label: 'Almacén / Depósito Fijo', value: 'WAREHOUSE', icon: '🏬' },
    { label: 'Taller de Mantenimiento', value: 'WORKSHOP', icon: '🔧' },
    { label: 'Frente de Obra', value: 'PROJECT', icon: '🏗️' },
    { label: 'Otro', value: 'OTHER', icon: '📍' },
  ];

  readonly projectOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: '-- Seleccionar obra --', value: null },
    ...this.projectService.projects().map((p) => ({
      label: p.name,
      value: p.id,
      icon: '🏗️',
    })),
  ]);

  readonly filterStatusOptions: CustomSelectOption<string>[] = [
    { label: 'Todos los Estados', value: 'ALL' },
    { label: 'Disponibles (Almacén)', value: 'AVAILABLE', icon: '🟢' },
    { label: 'En Uso (En Obra)', value: 'IN_USE', icon: '🟡' },
    { label: 'En Mantenimiento', value: 'MAINTENANCE', icon: '🟠' },
    { label: 'Dañadas / Fuera de Servicio', value: 'DAMAGED', icon: '🔴' },
    { label: 'Extraviadas / De Baja', value: 'LOST', icon: '⚪' },
    { label: 'Inactivas / Archivadas', value: 'INACTIVE', icon: '⚫' },
  ];

  readonly filterLocationOptions = computed<CustomSelectOption<string>[]>(() => [
    { label: 'Todas las Locaciones', value: 'ALL' },
    ...this.locationService.locations().map((l) => ({
      label: l.name,
      value: String(l.id),
      icon: l.location_type === 'PROJECT' ? '🏗️' : l.location_type === 'WORKSHOP' ? '🔧' : '🏬',
    })),
  ]);

  readonly filterCategoryOptions = computed<CustomSelectOption<string>[]>(() => [
    { label: 'Todas las Categorías', value: 'ALL' },
    ...this.categoryService.categories().map((c) => ({
      label: c.name,
      value: String(c.id),
    })),
  ]);

  // Modals visibility
  isToolModalOpen = signal<boolean>(false);
  isTransferModalOpen = signal<boolean>(false);
  isHistoryModalOpen = signal<boolean>(false);
  isLocationModalOpen = signal<boolean>(false);
  isCategoryModalOpen = signal<boolean>(false);
  isDeleteModalOpen = signal<boolean>(false);

  modalMode = signal<'create' | 'edit'>('create');
  isProcessing = signal<boolean>(false);

  // Form State: Tool
  selectedTool = signal<Tool | null>(null);
  toolCode = signal<string>('');
  toolName = signal<string>('');
  toolCategory = signal<number | null>(null);
  toolDetail = signal<string>('');
  toolBrand = signal<string>('');
  toolModel = signal<string>('');
  toolSerial = signal<string>('');
  toolLocation = signal<number | null>(null);
  toolStatus = signal<ToolStatus>('AVAILABLE');
  toolPurchaseDate = signal<string>('');
  toolPurchasePrice = signal<string>('');
  toolIsActive = signal<boolean>(true);

  // Form State: Transfer
  transferTool = signal<Tool | null>(null);
  transferDestinationLocation = signal<number | null>(null);
  transferResponsible = signal<string>('');
  transferNotes = signal<string>('');

  // History State
  toolHistoryList = signal<ToolTransfer[]>([]);
  historyTool = signal<Tool | null>(null);
  loadingHistory = signal<boolean>(false);

  // Form State: Location
  selectedLocation = signal<InventoryLocation | null>(null);
  locationName = signal<string>('');
  locationCode = signal<string>('');
  locationType = signal<LocationType>('WAREHOUSE');
  locationProject = signal<number | null>(null);
  locationAddress = signal<string>('');

  // Form State: Category
  selectedCategory = signal<ToolCategory | null>(null);
  categoryName = signal<string>('');
  categoryDescription = signal<string>('');

  // Delete target
  deleteTargetType = signal<'tool' | 'location' | 'category'>('tool');
  deleteTargetName = signal<string>('');
  deleteTargetId = signal<number | null>(null);

  // --- Computed Metrics ---
  totalToolsCount = computed(() => this.toolService.tools().length);
  availableToolsCount = computed(
    () => this.toolService.tools().filter((t) => t.status === 'AVAILABLE' && t.is_active).length
  );
  inUseToolsCount = computed(
    () => this.toolService.tools().filter((t) => t.status === 'IN_USE' && t.is_active).length
  );
  maintenanceToolsCount = computed(
    () => this.toolService.tools().filter((t) => t.status === 'MAINTENANCE' && t.is_active).length
  );

  // Filtered Tools
  filteredTools = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const statusFilter = this.selectedStatusFilter();
    const locationFilter = this.selectedLocationFilter();
    const categoryFilter = this.selectedCategoryFilter();

    let list = this.toolService.tools();

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'INACTIVE') {
        list = list.filter((t) => !t.is_active);
      } else {
        list = list.filter((t) => t.status === statusFilter && t.is_active);
      }
    }

    if (locationFilter !== 'ALL') {
      const locId = Number(locationFilter);
      list = list.filter((t) => t.current_location === locId);
    }

    if (categoryFilter !== 'ALL') {
      const catId = Number(categoryFilter);
      list = list.filter((t) => t.category === catId);
    }

    if (term) {
      list = list.filter(
        (t) =>
          t.code.toLowerCase().includes(term) ||
          t.name.toLowerCase().includes(term) ||
          (t.brand && t.brand.toLowerCase().includes(term)) ||
          (t.model_name && t.model_name.toLowerCase().includes(term)) ||
          (t.serial_number && t.serial_number.toLowerCase().includes(term)) ||
          (t.current_location_name && t.current_location_name.toLowerCase().includes(term))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.refreshAllData();
  }

  refreshAllData(): void {
    this.toolService.loadTools().subscribe();
    this.locationService.loadLocations().subscribe();
    this.categoryService.loadCategories().subscribe();
    this.transferService.loadTransfers().subscribe();
    this.projectService.loadProjects().subscribe();
  }

  // ==========================================
  // HERRAMIENTAS: Modales y Operaciones
  // ==========================================
  openCreateToolModal(): void {
    this.modalMode.set('create');
    this.selectedTool.set(null);
    this.toolCode.set('');
    this.toolName.set('');
    this.toolCategory.set(this.categoryService.categories()[0]?.id || null);
    this.toolDetail.set('');
    this.toolBrand.set('');
    this.toolModel.set('');
    this.toolSerial.set('');
    this.toolLocation.set(this.locationService.locations()[0]?.id || null);
    this.toolStatus.set('AVAILABLE');
    this.toolPurchaseDate.set('');
    this.toolPurchasePrice.set('');
    this.toolIsActive.set(true);
    this.isToolModalOpen.set(true);
  }

  openEditToolModal(tool: Tool): void {
    this.modalMode.set('edit');
    this.selectedTool.set(tool);
    this.toolCode.set(tool.code);
    this.toolName.set(tool.name);
    this.toolCategory.set(tool.category);
    this.toolDetail.set(tool.detail || '');
    this.toolBrand.set(tool.brand || '');
    this.toolModel.set(tool.model_name || '');
    this.toolSerial.set(tool.serial_number || '');
    this.toolLocation.set(tool.current_location);
    this.toolStatus.set(tool.status);
    this.toolPurchaseDate.set(tool.purchase_date || '');
    this.toolPurchasePrice.set(tool.purchase_price || '');
    this.toolIsActive.set(tool.is_active);
    this.isToolModalOpen.set(true);
  }

  closeToolModal(): void {
    this.isToolModalOpen.set(false);
  }

  submitToolForm(): void {
    const code = this.toolCode().trim().toUpperCase();
    const name = this.toolName().trim();
    const locationId = this.toolLocation();

    if (!code || !name || !locationId) return;

    this.isProcessing.set(true);

    const payload = {
      code,
      name,
      category: this.toolCategory(),
      detail: this.toolDetail().trim() || null,
      brand: this.toolBrand().trim() || null,
      model_name: this.toolModel().trim() || null,
      serial_number: this.toolSerial().trim() || null,
      current_location: locationId,
      status: this.toolStatus(),
      purchase_date: this.toolPurchaseDate() || null,
      purchase_price: this.toolPurchasePrice() ? this.toolPurchasePrice() : null,
      is_active: this.toolIsActive(),
    };

    if (this.modalMode() === 'create') {
      this.toolService.createTool(payload).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeToolModal();
          this.reloadStatsAndDependencies();
        },
        error: () => this.isProcessing.set(false),
      });
    } else {
      const tool = this.selectedTool();
      if (!tool) return;
      this.toolService.updateTool(tool.id, payload).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeToolModal();
          this.reloadStatsAndDependencies();
        },
        error: () => this.isProcessing.set(false),
      });
    }
  }

  toggleToolActive(tool: Tool): void {
    this.toolService.toggleActive(tool.id, tool.is_active).subscribe({
      next: () => this.reloadStatsAndDependencies(),
    });
  }

  quickChangeStatus(tool: Tool, newStatus: ToolStatus): void {
    const forceActive = newStatus === 'MAINTENANCE';
    this.toolService.updateStatus(tool.id, newStatus, forceActive).subscribe({
      next: () => this.reloadStatsAndDependencies(),
    });
  }

  private reloadStatsAndDependencies(): void {
    this.locationService.loadLocations().subscribe();
    this.categoryService.loadCategories().subscribe();
  }

  // ==========================================
  // TRASLADOS (MOVIMIENTOS)
  // ==========================================
  openTransferModal(tool: Tool): void {
    this.transferTool.set(tool);
    // Filtrar locaciones para no seleccionar la misma actual por defecto
    const availableLocs = this.locationService
      .locations()
      .filter((loc) => loc.id !== tool.current_location && loc.is_active);
    this.transferDestinationLocation.set(availableLocs[0]?.id || null);
    this.transferResponsible.set('');
    this.transferNotes.set('');
    this.isTransferModalOpen.set(true);
  }

  closeTransferModal(): void {
    this.isTransferModalOpen.set(false);
  }

  submitTransfer(): void {
    const tool = this.transferTool();
    const destinationId = this.transferDestinationLocation();

    if (!tool || !destinationId) return;

    this.isProcessing.set(true);

    this.transferService
      .createTransfer({
        tool_id: tool.id,
        destination_location_id: destinationId,
        responsible_person: this.transferResponsible().trim() || null,
        notes: this.transferNotes().trim() || null,
      })
      .subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeTransferModal();
          // Recargar herramientas, locaciones y categorías para actualizar conteos y ubicación
          this.toolService.loadTools().subscribe();
          this.reloadStatsAndDependencies();
        },
        error: () => this.isProcessing.set(false),
      });
  }

  // ==========================================
  // HISTORIAL DE HERRAMIENTA
  // ==========================================
  openHistoryModal(tool: Tool): void {
    this.historyTool.set(tool);
    this.loadingHistory.set(true);
    this.isHistoryModalOpen.set(true);

    this.toolService.getToolHistory(tool.id).subscribe({
      next: (history) => {
        this.toolHistoryList.set(history);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false),
    });
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen.set(false);
    this.historyTool.set(null);
    this.toolHistoryList.set([]);
  }

  // ==========================================
  // LOCACIONES: Modales y Operaciones
  // ==========================================
  openCreateLocationModal(): void {
    this.modalMode.set('create');
    this.selectedLocation.set(null);
    this.locationName.set('');
    this.locationCode.set('');
    this.locationType.set('WAREHOUSE');
    this.locationProject.set(null);
    this.locationAddress.set('');
    this.isLocationModalOpen.set(true);
  }

  openEditLocationModal(location: InventoryLocation): void {
    this.modalMode.set('edit');
    this.selectedLocation.set(location);
    this.locationName.set(location.name);
    this.locationCode.set(location.code || '');
    this.locationType.set(location.location_type);
    this.locationProject.set(location.project);
    this.locationAddress.set(location.address || '');
    this.isLocationModalOpen.set(true);
  }

  closeLocationModal(): void {
    this.isLocationModalOpen.set(false);
  }

  submitLocationForm(): void {
    const name = this.locationName().trim();
    if (!name) return;

    this.isProcessing.set(true);

    const payload = {
      name,
      code: this.locationCode().trim().toUpperCase() || null,
      location_type: this.locationType(),
      project: this.locationType() === 'PROJECT' ? this.locationProject() : null,
      address: this.locationAddress().trim() || null,
    };

    if (this.modalMode() === 'create') {
      this.locationService.createLocation(payload).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeLocationModal();
        },
        error: () => this.isProcessing.set(false),
      });
    } else {
      const loc = this.selectedLocation();
      if (!loc) return;
      this.locationService.updateLocation(loc.id, payload).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeLocationModal();
        },
        error: () => this.isProcessing.set(false),
      });
    }
  }

  // ==========================================
  // CATEGORÍAS: Modales y Operaciones
  // ==========================================
  openCreateCategoryModal(): void {
    this.modalMode.set('create');
    this.selectedCategory.set(null);
    this.categoryName.set('');
    this.categoryDescription.set('');
    this.isCategoryModalOpen.set(true);
  }

  openEditCategoryModal(cat: ToolCategory): void {
    this.modalMode.set('edit');
    this.selectedCategory.set(cat);
    this.categoryName.set(cat.name);
    this.categoryDescription.set(cat.description || '');
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
  }

  submitCategoryForm(): void {
    const name = this.categoryName().trim();
    if (!name) return;

    this.isProcessing.set(true);

    const payload = {
      name,
      description: this.categoryDescription().trim() || null,
    };

    if (this.modalMode() === 'create') {
      this.categoryService.createCategory(payload).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeCategoryModal();
        },
        error: () => this.isProcessing.set(false),
      });
    } else {
      const cat = this.selectedCategory();
      if (!cat) return;
      this.categoryService.updateCategory(cat.id, payload).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeCategoryModal();
        },
        error: () => this.isProcessing.set(false),
      });
    }
  }

  // ==========================================
  // ELIMINACIÓN GENÉRICA
  // ==========================================
  openDeleteModal(
    type: 'tool' | 'location' | 'category',
    id: number,
    name: string
  ): void {
    this.deleteTargetType.set(type);
    this.deleteTargetId.set(id);
    this.deleteTargetName.set(name);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deleteTargetId.set(null);
  }

  submitDelete(): void {
    const id = this.deleteTargetId();
    if (!id) return;

    this.isProcessing.set(true);
    const type = this.deleteTargetType();

    if (type === 'tool') {
      this.toolService.deleteTool(id).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeDeleteModal();
          this.reloadStatsAndDependencies();
        },
        error: () => this.isProcessing.set(false),
      });
    } else if (type === 'location') {
      this.locationService.deleteLocation(id).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeDeleteModal();
        },
        error: () => this.isProcessing.set(false),
      });
    } else if (type === 'category') {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeDeleteModal();
        },
        error: () => this.isProcessing.set(false),
      });
    }
  }
}
