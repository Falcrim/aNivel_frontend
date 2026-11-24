export type BudgetCategoryType = 'materials' | 'labor' | 'operating' | 'administrative';

export interface BudgetItem {
  id: number;
  project: number;
  project_name: string;
  category_type: BudgetCategoryType;
  category_type_display: string;

  stage: number | null;
  stage_id: number | null;
  stage_name: string | null;
  stage_color: string | null;

  subcategory: number | null;
  subcategory_id: number | null;
  subcategory_name: string | null;
  category_name: string | null;

  supplier: number | null;
  supplier_id: number | null;
  supplier_name: string | null;
  supplier_phone: string | null;

  name: string;
  detail: string;
  is_global: boolean;
  apply_ceil: boolean;

  unit_measure: number | null;
  unit_measure_name: string | null;
  unit_measure_abbr: string | null;
  quantity_obra: string | number | null;

  unit_purchase: number | null;
  unit_purchase_name: string | null;
  unit_purchase_abbr: string | null;
  conversion_factor: string | number;
  waste_pct: string | number;
  quantity_purchase: string | number;
  unit_price: string | number;
  weight_per_purchase_unit: string | number | null;

  contractor_name: string;
  percentage_applied: string | number | null;
  target_base_cost: string | number | null;
  notes: string;
  catalog_reference_id: number | null;
  order: number;

  // Calculados por la estrategia DDD activa
  estimated_cost: string | number;
  weight_total: string | number | null;
  cost_usd: string | number;
  cost_per_m2_usd: string | number;

  created_at: string;
  updated_at: string;
}

export interface BudgetItemGrouped {
  subcategory_id: number | null;
  subcategory_name: string;
  category_name: string;
  items_count: number;
  subtotal_cost_bs: string;
  subtotal_cost_usd: string;
  subtotal_weight_kg: string;
  total_purchase_units_summary: string;
  items: BudgetItem[];
}

export interface BudgetSubcategoryCluster {
  subcategory_id: number | null;
  subcategory_name: string;
  items_count: number;
  subtotal_cost_bs: string;
  subtotal_cost_usd: string;
  total_purchase_units_summary: string;
  items: BudgetItem[];
}

export interface BudgetStageGrouped {
  stage_id: number | null;
  stage_name: string;
  stage_color: string;
  stage_order: number;
  items_count: number;
  subtotal_cost_bs: string;
  subtotal_cost_usd: string;
  percentage_of_family: string;
  cost_per_m2_usd: string;
  subcategories: BudgetSubcategoryCluster[];
}

export interface BudgetSummaryCategoryBreakdown {
  total_cost_bs: string;
  total_cost_usd: string;
  total_weight_kg?: string;
  cost_per_m2_usd?: string;
  items_count: number;
}

export interface BudgetSummary {
  project_id: number;
  project_name: string;
  built_area: string;
  exchange_rate: string;
  total_budget_bs: string;
  total_budget_usd: string;
  cost_per_m2_usd: string;
  total_weight_kg: string;
  total_items_count: number;
  materials: BudgetSummaryCategoryBreakdown;
  labor: BudgetSummaryCategoryBreakdown;
  operating: BudgetSummaryCategoryBreakdown;
  administrative: BudgetSummaryCategoryBreakdown;
}

export interface BudgetItemCreatePayload {
  project: number;
  category_type: BudgetCategoryType;
  stage?: number | null;
  subcategory?: number | null;
  supplier?: number | null;
  name: string;
  detail?: string;
  is_global?: boolean;
  apply_ceil?: boolean;
  unit_measure?: number | null;
  quantity_obra?: number | null;
  unit_purchase?: number | null;
  conversion_factor?: number | null;
  waste_pct?: number | null;
  quantity_purchase?: number | null;
  unit_price: number;
  weight_per_purchase_unit?: number | null;
  contractor_name?: string;
  percentage_applied?: number | null;
  target_base_cost?: number | null;
  notes?: string;
}
