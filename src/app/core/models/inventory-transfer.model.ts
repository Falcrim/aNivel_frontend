import { LocationType } from './inventory-location.model';

export interface ToolTransfer {
  id: number;
  tool: number;
  tool_code: string;
  tool_name: string;
  origin_location: number;
  origin_location_name: string;
  origin_location_type: LocationType;
  destination_location: number;
  destination_location_name: string;
  destination_location_type: LocationType;
  destination_project_id: number | null;
  transfer_date: string;
  responsible_person: string | null;
  created_by: number | null;
  created_by_username: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateToolTransferDto {
  tool_id: number;
  destination_location_id: number;
  responsible_person?: string | null;
  notes?: string | null;
  override_status?: string | null;
}
