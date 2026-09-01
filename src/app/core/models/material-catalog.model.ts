import { Subcategory } from './subcategory.model';
import { UnitOfMeasure } from './unit-of-measure.model';
import { PurchaseUnit } from './purchase-unit.model';

export interface MaterialCatalogItem {
  id: number;
  subcategory: number;
  subcategory_detail?: Subcategory;
  name: string;
  description: string;
  unit_measure: number;
  unit_measure_detail?: UnitOfMeasure;
  unit_purchase: number;
  unit_purchase_detail?: PurchaseUnit;
  conversion_factor: number | string | null;
  weight_per_purchase_unit: number | string | null;
  waste_pct: number | string;
  price_per_purchase_unit: number | string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMaterialCatalogItemDto {
  subcategory: number;
  name: string;
  description?: string;
  unit_measure: number;
  unit_purchase: number;
  conversion_factor?: number | string | null;
  weight_per_purchase_unit?: number | string | null;
  waste_pct?: number | string;
  price_per_purchase_unit?: number | string | null;
  is_active?: boolean;
}

export interface UpdateMaterialCatalogItemDto {
  subcategory: number;
  name: string;
  description?: string;
  unit_measure: number;
  unit_purchase: number;
  conversion_factor?: number | string | null;
  weight_per_purchase_unit?: number | string | null;
  waste_pct?: number | string;
  price_per_purchase_unit?: number | string | null;
  is_active?: boolean;
}

export interface MaterialCatalogGrouped {
  subcategory_id: number;
  subcategory_name: string;
  category_name: string;
  items_count: number;
  items: MaterialCatalogItem[];
}
