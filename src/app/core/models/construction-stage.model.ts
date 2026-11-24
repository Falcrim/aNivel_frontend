export interface ConstructionStage {
  id: number;
  name: string;
  description?: string | null;
  order: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateConstructionStageDto {
  name: string;
  description?: string;
  order?: number;
  color?: string;
  is_active?: boolean;
}

export interface UpdateConstructionStageDto {
  name?: string;
  description?: string;
  order?: number;
  color?: string;
  is_active?: boolean;
}
