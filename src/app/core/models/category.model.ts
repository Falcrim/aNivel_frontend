import { Subcategory } from './subcategory.model';

export interface Category {
  id: number;
  name: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}
