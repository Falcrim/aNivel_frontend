import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { Category } from '../../../core/models/category.model';
import { Subcategory } from '../../../core/models/subcategory.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-categories-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ConfirmDialogComponent,
    CustomSelectComponent,
  ],
  templateUrl: './categories-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesManagerComponent implements OnInit {
  protected readonly categoryService = inject(CategoryService);
  protected readonly subcategoryService = inject(SubcategoryService);

  // Active tab: 'hierarchy' (master-detail) | 'table' (flat table)
  activeTab = signal<'hierarchy' | 'table'>('hierarchy');

  // Selected Category in Hierarchy view
  selectedCategory = signal<Category | null>(null);

  // Search & Filter
  searchTerm = signal('');
  filterCategory = signal<number | null>(null);

  // Computed Select Options
  readonly categoryFilterOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Todas las categorías', value: null },
    ...this.categoryService.categories().map((c) => ({
      label: c.name,
      value: c.id,
    })),
  ]);

  readonly categoryFormOptions = computed<CustomSelectOption<number>[]>(() =>
    this.categoryService.categories().map((c) => ({
      label: c.name,
      value: c.id,
    }))
  );

  // Quick inline add for subcategory
  quickSubcategoryName = signal('');

  // Modals state
  isCategoryModalOpen = signal(false);
  isSubcategoryModalOpen = signal(false);
  isDeleteCategoryOpen = signal(false);
  isDeleteSubcategoryOpen = signal(false);

  // Form states
  categoryFormMode = signal<'create' | 'edit'>('create');
  categoryNameForm = signal('');
  categoryToEdit = signal<Category | null>(null);

  subcategoryFormMode = signal<'create' | 'edit'>('create');
  subcategoryNameForm = signal('');
  subcategoryCategoryIdForm = signal<number>(0);
  subcategoryToEdit = signal<Subcategory | null>(null);

  categoryToDelete = signal<Category | null>(null);
  subcategoryToDelete = signal<Subcategory | null>(null);

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

  // Categories with counts
  categoriesWithCount = computed(() => {
    const categories = this.categoryService.categories();
    const subcategories = this.subcategoryService.subcategories();

    return categories.map((cat) => ({
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
      next: (cats) => {
        if (cats.length > 0 && !this.selectedCategory()) {
          this.selectedCategory.set(cats[0]);
        }
      },
    });
    this.subcategoryService.loadSubcategories().subscribe();
  }

  selectCategory(cat: Category): void {
    this.selectedCategory.set(cat);
  }

  // Category CRUD
  openCreateCategoryModal(): void {
    this.categoryFormMode.set('create');
    this.categoryNameForm.set('');
    this.categoryToEdit.set(null);
    this.isCategoryModalOpen.set(true);
  }

  openEditCategoryModal(cat: Category): void {
    this.categoryFormMode.set('edit');
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
    if (!name) return;

    this.isProcessing.set(true);
    if (this.categoryFormMode() === 'create') {
      this.categoryService.createCategory({ name }).subscribe({
        next: (newCat) => {
          this.isProcessing.set(false);
          this.closeCategoryModal();
          this.selectedCategory.set(newCat);
        },
        error: () => {
          this.isProcessing.set(false);
        },
      });
    } else {
      const cat = this.categoryToEdit();
      if (!cat) return;
      this.categoryService.updateCategory(cat.id, { name }).subscribe({
        next: (updated) => {
          this.isProcessing.set(false);
          this.closeCategoryModal();
          if (this.selectedCategory()?.id === updated.id) {
            this.selectedCategory.set(updated);
          }
        },
        error: () => {
          this.isProcessing.set(false);
        },
      });
    }
  }

  openDeleteCategoryModal(cat: Category): void {
    this.categoryToDelete.set(cat);
    this.isDeleteCategoryOpen.set(true);
  }

  closeDeleteCategoryModal(): void {
    this.isDeleteCategoryOpen.set(false);
    this.categoryToDelete.set(null);
  }

  submitDeleteCategory(): void {
    const cat = this.categoryToDelete();
    if (!cat) return;

    this.isProcessing.set(true);
    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeDeleteCategoryModal();
        const remaining = this.categoryService.categories();
        this.selectedCategory.set(remaining.length > 0 ? remaining[0] : null);
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
}
