export interface Subcategory {
  id: number;
  category: number;
  name: string;
  category_name?: string; // enriquecido en cliente para facilitar visualizaciones
}

export interface CreateSubcategoryDto {
  category: number;
  name: string;
}

export interface UpdateSubcategoryDto {
  category: number;
  name: string;
}
