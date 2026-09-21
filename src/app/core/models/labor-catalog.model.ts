import { Subcategory } from './subcategory.model';
import { UnitOfMeasure } from './unit-of-measure.model';

export interface LaborCatalogItem {
  id: number;
  subcategory: number;
  subcategory_detail?: Subcategory;
  name: string;
  detail?: string;
  unit: number;
  unit_detail?: UnitOfMeasure;
  suggested_cost: number | string;
  contractor_type?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLaborCatalogItemDto {
  subcategory: number;
  name: string;
  detail?: string;
  unit: number;
  suggested_cost: number;
  contractor_type?: string;
  is_active?: boolean;
}

export type UpdateLaborCatalogItemDto = Partial<CreateLaborCatalogItemDto>;

export interface LaborCatalogGrouped {
  subcategory_id: number;
  subcategory_name: string;
  items_count: number;
  items: LaborCatalogItem[];
}

