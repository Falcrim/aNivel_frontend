export interface Subcategory {
  id: number;
  category: number;
  name: string;
  category_name?: string;
  category_detail?: { id: number; code?: string; name: string; is_active?: boolean };
}

export interface CreateSubcategoryDto {
  category: number;
  name: string;
}

export interface UpdateSubcategoryDto {
  category: number;
  name: string;
}
