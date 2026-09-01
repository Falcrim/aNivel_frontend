import { Project } from './project.model';
import { Subcategory } from './subcategory.model';
import { UnitOfMeasure } from './unit-of-measure.model';
import { PurchaseUnit } from './purchase-unit.model';
import { MaterialCatalogItem } from './material-catalog.model';

export interface MaterialBudgetItem {
  id: number;
  project: number;
  project_detail?: Project;
  catalog_item: number | null;
  catalog_item_detail?: MaterialCatalogItem;
  subcategory: number;
  subcategory_detail?: Subcategory;
  name: string;
  detail: string;
  is_global: boolean;
  unit_measure: number;
  unit_measure_detail?: UnitOfMeasure;
  unit_purchase: number;
  unit_purchase_detail?: PurchaseUnit;
  conversion_factor: number | string | null;
  weight_per_purchase_unit: number | string | null;
  waste_pct: number | string;
  quantity_obra: number | string | null;
  quantity_purchase: number | string;
  price_per_purchase_unit: number | string;
  weight_total?: number | string | null;
  estimated_cost?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface FromCatalogPayload {
  project: number;
  catalog_item: number;
  quantity_obra: number;
  detail?: string;
  waste_pct?: number | null;
  price_override?: number | null;
  subcategory?: number | null;
}

export interface FromCatalogGlobalPayload {
  project: number;
  catalog_item: number;
  quantity_purchase: number;
  price_per_purchase_unit?: number | null;
  detail?: string;
  subcategory?: number | null;
}

export interface CustomBudgetItemPayload {
  project: number;
  subcategory: number;
  name: string;
  unit_measure: number;
  unit_purchase: number;
  price_per_purchase_unit: number;
  is_global?: boolean;
  quantity_obra?: number | null;
  quantity_purchase?: number | null;
  conversion_factor?: number | null;
  weight_per_purchase_unit?: number | null;
  waste_pct?: number;
  detail?: string;
}

export interface UpdateBudgetItemDto {
  name?: string;
  detail?: string;
  quantity_obra?: number | null;
  quantity_purchase?: number | null;
  price_per_purchase_unit?: number;
  waste_pct?: number;
  conversion_factor?: number | null;
  weight_per_purchase_unit?: number | null;
}

export interface SubcategoryBudgetGroup {
  subcategory_id: number;
  subcategory_name: string;
  subtotal_cost: number | string;
  subtotal_weight: number | string;
  items_count: number;
  items: MaterialBudgetItem[];
}

export interface ProjectBudgetGroupedResponse {
  project_id: number;
  project_name: string;
  total_materials_cost: number | string;
  total_materials_weight_kg: number | string;
  subcategories_count: number;
  total_items_count: number;
  groups: SubcategoryBudgetGroup[];
}

export interface ProjectBudgetSummaryResponse {
  project_id: number;
  total_materials_cost: number | string;
  total_materials_weight_kg: number | string;
  total_items: number;
  normal_items_count: number;
  global_items_count: number;
  from_catalog_count: number;
  custom_items_count: number;
}
