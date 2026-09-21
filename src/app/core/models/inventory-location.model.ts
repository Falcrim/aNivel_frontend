export type LocationType = 'WAREHOUSE' | 'PROJECT' | 'WORKSHOP' | 'OTHER';

export interface InventoryLocation {
  id: number;
  name: string;
  code: string | null;
  location_type: LocationType;
  location_type_display: string;
  project: number | null;
  project_name: string | null;
  address: string | null;
  is_active: boolean;
  tools_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationDto {
  name: string;
  code?: string | null;
  location_type: LocationType;
  project?: number | null;
  address?: string | null;
  is_active?: boolean;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {}
