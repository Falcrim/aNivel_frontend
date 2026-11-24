import { Subcategory } from './subcategory.model';

export interface Category {
  id: number;
  code?: string;
  name: string;
  is_active?: boolean;
}

export interface UpdateCategoryDto {
  name: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}
