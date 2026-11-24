import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { ConstructionStageService } from '../../../core/services/construction-stage.service';
import { Category } from '../../../core/models/category.model';
import { Subcategory } from '../../../core/models/subcategory.model';
import { ConstructionStage, CreateConstructionStageDto, UpdateConstructionStageDto } from '../../../core/models/construction-stage.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { InfoTooltipComponent } from '../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-categories-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ConfirmDialogComponent,
    CustomSelectComponent,
    InfoTooltipComponent,
  ],
  templateUrl: './categories-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesManagerComponent implements OnInit {
  protected readonly categoryService = inject(CategoryService);
  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly stageService = inject(ConstructionStageService);

  // Active tab: 'hierarchy' (master-detail) | 'table' (flat table) | 'stages' (etapas de obra)
  activeTab = signal<'hierarchy' | 'table' | 'stages'>('hierarchy');

  // Selected Category in Hierarchy view
  selectedCategory = signal<Category | null>(null);

  // Search & Filter
  searchTerm = signal('');
  filterCategory = signal<number | null>(null);

  // Computed Select Options
  readonly categoryFilterOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Todas las categorías', value: null },
    ...this.categoryService.categories().map((c) => ({
      label: c.is_active === false ? `${c.name} (Próximamente)` : c.name,
      value: c.id,
    })),
  ]);

  readonly categoryFormOptions = computed<CustomSelectOption<number>[]>(() =>
    this.categoryService.categories().map((c) => ({
      label: c.is_active === false ? `${c.name} (Próximamente)` : c.name,
      value: c.id,
    }))
  );

  // Quick inline add for subcategory
  quickSubcategoryName = signal('');

  // Modals state
  isCategoryModalOpen = signal(false);
  isSubcategoryModalOpen = signal(false);
  isDeleteSubcategoryOpen = signal(false);

  // Form states
  categoryNameForm = signal('');
  categoryToEdit = signal<Category | null>(null);

  subcategoryFormMode = signal<'create' | 'edit'>('create');
  subcategoryNameForm = signal('');
  subcategoryCategoryIdForm = signal<number>(0);
  subcategoryToEdit = signal<Subcategory | null>(null);

  subcategoryToDelete = signal<Subcategory | null>(null);

  // Stage Modals & Form states
  isStageModalOpen = signal(false);
  isDeleteStageOpen = signal(false);
  stageFormMode = signal<'create' | 'edit'>('create');
  stageNameForm = signal('');
  stageDescriptionForm = signal('');
  stageOrderForm = signal(1);
  stageColorForm = signal('amber');
  stageToEdit = signal<ConstructionStage | null>(null);
  stageToDelete = signal<ConstructionStage | null>(null);

  isProcessing = signal(false);

  // Computed enriched subcategories
  enrichedSubcategories = computed(() => {
    const categories = this.categoryService.categories();
    const subcategories = this.subcategoryService.subcategories();

    return subcategories.map((sub) => {
      const parentCat = categories.find((c) => c.id === sub.category);
      return {
        ...sub,
        category_name: parentCat ? parentCat.name : `Categoría #${sub.category}`,
        category_is_active: parentCat ? parentCat.is_active !== false : true,
      };
    });
  });

  // Filtered subcategories for table view
  filteredSubcategories = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filterCatId = this.filterCategory();
    let list = this.enrichedSubcategories();

    if (filterCatId) {
      list = list.filter((s) => s.category === filterCatId);
    }

    if (term) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.category_name && s.category_name.toLowerCase().includes(term)) ||
          s.id.toString().includes(term)
      );
    }

    return list;
  });

  // Categories with counts (activas primero, luego futuras)
  categoriesWithCount = computed(() => {
    const categories = this.categoryService.categories();
    const subcategories = this.subcategoryService.subcategories();

    return [...categories]
      .sort((a, b) => {
        const activeA = a.is_active === false ? 1 : 0;
        const activeB = b.is_active === false ? 1 : 0;
        if (activeA !== activeB) return activeA - activeB;
        return a.name.localeCompare(b.name);
      })
      .map((cat) => ({
        ...cat,
        count: subcategories.filter((s) => s.category === cat.id).length,
      }));
  });

  // Current subcategories for the selected category in hierarchy view
  currentSubcategories = computed(() => {
    const selected = this.selectedCategory();
    if (!selected) return [];
    return this.subcategoryService.subcategories().filter((s) => s.category === selected.id);
  });

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe({
      next: () => {
        const sorted = this.categoriesWithCount();
        if (sorted.length > 0 && !this.selectedCategory()) {
          this.selectedCategory.set(sorted[0]);
        }
      },
    });
    this.subcategoryService.loadSubcategories().subscribe();
    this.stageService.loadStages().subscribe();
  }

  selectCategory(cat: Category): void {
    this.selectedCategory.set(cat);
  }

  // Category Rename (Create/Delete blocked intentionally)
  openEditCategoryModal(cat: Category): void {
    this.categoryNameForm.set(cat.name);
    this.categoryToEdit.set(cat);
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
    this.categoryToEdit.set(null);
  }

  submitCategory(): void {
    const name = this.categoryNameForm().trim();
    const cat = this.categoryToEdit();
    if (!name || !cat) return;

    this.isProcessing.set(true);
    this.categoryService.updateCategory(cat.id, { name }).subscribe({
      next: (updated) => {
        this.isProcessing.set(false);
        this.closeCategoryModal();
        if (this.selectedCategory()?.id === updated.id) {
          this.selectedCategory.set(updated);
        }
        this.subcategoryService.loadSubcategories().subscribe();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  // Subcategory CRUD
  openCreateSubcategoryModal(presetCategoryId?: number): void {
    this.subcategoryFormMode.set('create');
    this.subcategoryNameForm.set('');
    const targetCatId =
      presetCategoryId ||
      this.selectedCategory()?.id ||
      (this.categoryService.categories()[0]?.id ?? 0);
    this.subcategoryCategoryIdForm.set(targetCatId);
    this.subcategoryToEdit.set(null);
    this.isSubcategoryModalOpen.set(true);
  }

  openEditSubcategoryModal(sub: Subcategory): void {
    this.subcategoryFormMode.set('edit');
    this.subcategoryNameForm.set(sub.name);
    this.subcategoryCategoryIdForm.set(sub.category);
    this.subcategoryToEdit.set(sub);
    this.isSubcategoryModalOpen.set(true);
  }

  closeSubcategoryModal(): void {
    this.isSubcategoryModalOpen.set(false);
    this.subcategoryToEdit.set(null);
  }

  submitSubcategory(): void {
    const name = this.subcategoryNameForm().trim();
    const category = Number(this.subcategoryCategoryIdForm());
    if (!name || !category) return;

    this.isProcessing.set(true);
    if (this.subcategoryFormMode() === 'create') {
      this.subcategoryService.createSubcategory({ name, category }).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeSubcategoryModal();
        },
        error: () => {
          this.isProcessing.set(false);
        },
      });
    } else {
      const sub = this.subcategoryToEdit();
      if (!sub) return;
      this.subcategoryService.updateSubcategory(sub.id, { name, category }).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeSubcategoryModal();
        },
        error: () => {
          this.isProcessing.set(false);
        },
      });
    }
  }

  submitQuickSubcategory(): void {
    const name = this.quickSubcategoryName().trim();
    const selected = this.selectedCategory();
    if (!name || !selected) return;

    this.isProcessing.set(true);
    this.subcategoryService.createSubcategory({ name, category: selected.id }).subscribe({
      next: () => {
        this.quickSubcategoryName.set('');
        this.isProcessing.set(false);
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  openDeleteSubcategoryModal(sub: Subcategory): void {
    this.subcategoryToDelete.set(sub);
    this.isDeleteSubcategoryOpen.set(true);
  }

  closeDeleteSubcategoryModal(): void {
    this.isDeleteSubcategoryOpen.set(false);
    this.subcategoryToDelete.set(null);
  }

  submitDeleteSubcategory(): void {
    const sub = this.subcategoryToDelete();
    if (!sub) return;

    this.isProcessing.set(true);
    this.subcategoryService.deleteSubcategory(sub.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeDeleteSubcategoryModal();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  // --- Handlers para Etapas Constructivas ---
  openCreateStageModal(): void {
    this.stageFormMode.set('create');
    this.stageToEdit.set(null);
    this.stageNameForm.set('');
    this.stageDescriptionForm.set('');
    const nextOrder = (this.stageService.stages().length + 1) * 10;
    this.stageOrderForm.set(nextOrder);
    this.stageColorForm.set('amber');
    this.isStageModalOpen.set(true);
  }

  openEditStageModal(stage: ConstructionStage): void {
    this.stageFormMode.set('edit');
    this.stageToEdit.set(stage);
    this.stageNameForm.set(stage.name);
    this.stageDescriptionForm.set(stage.description || '');
    this.stageOrderForm.set(stage.order);
    this.stageColorForm.set(stage.color || 'amber');
    this.isStageModalOpen.set(true);
  }

  closeStageModal(): void {
    this.isStageModalOpen.set(false);
    this.stageToEdit.set(null);
  }

  openDeleteStageModal(stage: ConstructionStage): void {
    this.stageToDelete.set(stage);
    this.isDeleteStageOpen.set(true);
  }

  closeDeleteStageModal(): void {
    this.isDeleteStageOpen.set(false);
    this.stageToDelete.set(null);
  }

  submitStageForm(): void {
    const name = this.stageNameForm().trim();
    if (!name) return;

    this.isProcessing.set(true);

    if (this.stageFormMode() === 'create') {
      const dto: CreateConstructionStageDto = {
        name,
        description: this.stageDescriptionForm().trim() || undefined,
        order: this.stageOrderForm(),
        color: this.stageColorForm(),
      };

      this.stageService.createStage(dto).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeStageModal();
        },
        error: () => this.isProcessing.set(false),
      });
    } else {
      const target = this.stageToEdit();
      if (!target) return;

      const dto: UpdateConstructionStageDto = {
        name,
        description: this.stageDescriptionForm().trim() || undefined,
        order: this.stageOrderForm(),
        color: this.stageColorForm(),
      };

      this.stageService.updateStage(target.id, dto).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.closeStageModal();
        },
        error: () => this.isProcessing.set(false),
      });
    }
  }

  submitDeleteStage(): void {
    const target = this.stageToDelete();
    if (!target) return;

    this.isProcessing.set(true);
    this.stageService.deleteStage(target.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeDeleteStageModal();
      },
      error: () => this.isProcessing.set(false),
    });
  }
}
