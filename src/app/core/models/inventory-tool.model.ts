import { LocationType } from './inventory-location.model';

export type ToolStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DAMAGED' | 'LOST';

export interface Tool {
  id: number;
  code: string;
  name: string;
  category: number | null;
  category_name: string | null;
  detail: string | null;
  brand: string | null;
  model_name: string | null;
  serial_number: string | null;
  current_location: number;
  current_location_name: string;
  current_location_type: LocationType;
  current_project_id: number | null;
  current_project_name: string | null;
  status: ToolStatus;
  status_display: string;
  purchase_date: string | null;
  purchase_price: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateToolDto {
  code: string;
  name: string;
  category?: number | null;
  detail?: string | null;
  brand?: string | null;
  model_name?: string | null;
  serial_number?: string | null;
  current_location: number;
  status?: ToolStatus;
  purchase_date?: string | null;
  purchase_price?: string | number | null;
  is_active?: boolean;
}

export interface UpdateToolDto extends Partial<CreateToolDto> {}
