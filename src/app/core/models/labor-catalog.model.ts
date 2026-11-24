import { Subcategory } from './subcategory.model';
import { UnitOfMeasure } from './unit-of-measure.model';

export interface LaborCatalogItem {
  id: number;
  subcategory: number;
  subcategory_detail?: Subcategory;
  supplier?: number | null;
  supplier_name?: string | null;
  supplier_phone?: string | null;
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
  supplier?: number | null;
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

