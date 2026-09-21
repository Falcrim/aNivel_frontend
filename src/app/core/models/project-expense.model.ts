export type ExpenseCategoryType =
  | 'materials'
  | 'labor'
  | 'operating'
  | 'administrative'
  | 'other';

export type PaymentStatus = 'paid' | 'in_process' | 'pending';

export interface ProjectExpense {
  id: number;
  project: number;
  project_name: string;
  category_type: ExpenseCategoryType;
  category_type_display: string;
  subcategory: number | null;
  subcategory_name: string;
  item_name: string;
  unit_name: string;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
  payment_status: PaymentStatus;
  payment_status_display: string;
  expense_date: string;
  payment_method: string;
  supplier_name: string;
  details: string;
  rendicion_number: string;
  receipt_file?: string;
  receipt_file_url: string;
  receipt_number: string;
  receipt_file_name: string;
  receipt_file_size: number;
  receipt_file_size_formatted: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectExpenseSummary {
  project_id: number;
  total_count: number;
  total_amount: number;
  paid_amount: number;
  in_process_amount: number;
  pending_amount: number;
  materials_amount: number;
  labor_amount: number;
  operating_amount: number;
  administrative_amount: number;
  receipts_count: number;
  rendiciones: string[];
}

export interface CreateProjectExpenseDto {
  project: number;
  category_type: ExpenseCategoryType;
  subcategory?: number | null;
  item_name: string;
  unit_name: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  payment_status: PaymentStatus;
  expense_date: string;
  payment_method?: string;
  supplier_name?: string;
  details?: string;
  rendicion_number?: string;
  receipt_file?: File | null;
  receipt_number?: string;
}
