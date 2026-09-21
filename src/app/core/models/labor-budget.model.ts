import { Project } from './project.model';
import { Subcategory } from './subcategory.model';
import { UnitOfMeasure } from './unit-of-measure.model';
import { LaborCatalogItem } from './labor-catalog.model';

export interface LaborBudgetItem {
  id: number;
  project: number;
  project_detail?: Project;
  catalog_item?: number | null;
  catalog_item_detail?: LaborCatalogItem | null;
  subcategory: number;
  subcategory_detail?: Subcategory;
  contractor_name?: string;
  name: string;
  detail?: string;
  unit: number;
  unit_detail?: UnitOfMeasure;
  quantity: number | string;
  unit_cost: number | string;
  estimated_cost: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface LaborBudgetSummary {
  project_id: number;
  project_name: string;
  project_status: string;
  project_status_display: string;
  built_area: number | string;
  exchange_rate: number | string;
  total_labor_cost_bs: number | string;
  total_labor_cost_usd: number | string;
  cost_per_m2_bs: number | string;
  cost_per_m2_usd: number | string;
  total_items: number;
  from_catalog_count: number;
  custom_items_count: number;
}

export interface LaborBudgetGroup {
  subcategory_id: number;
  subcategory_name: string;
  subtotal_cost_bs: number;
  subtotal_cost_usd: number;
  cost_per_m2_usd: number;
  items_count: number;
  items: LaborBudgetItem[];
}

export interface LaborGroupedBudget {
  project_id: number;
  project_name: string;
  built_area: number | string;
  exchange_rate: number | string;
  total_labor_cost_bs: number;
  total_labor_cost_usd: number;
  cost_per_m2_usd: number;
  subcategories_count: number;
  total_items_count: number;
  groups: LaborBudgetGroup[];
}

export interface FromLaborCatalogDto {
  project: number;
  catalog_item: number;
  quantity: number;
  cost_override?: number | null;
  contractor_name?: string;
  detail?: string;
  subcategory?: number | null;
}

export interface CustomLaborBudgetItemDto {
  project: number;
  subcategory: number;
  name: string;
  unit: number;
  quantity: number;
  unit_cost: number;
  contractor_name?: string;
  detail?: string;
}

export interface UpdateLaborBudgetItemDto {
  project: number;
  subcategory: number;
  name: string;
  unit: number;
  quantity: number;
  unit_cost: number;
  contractor_name?: string;
  detail?: string;
}
