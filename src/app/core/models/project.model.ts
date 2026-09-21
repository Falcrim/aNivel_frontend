export type ProjectStatus = 'budget' | 'active' | 'paused' | 'cancelled' | 'completed';

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  status_display?: string;
  built_area: number | string;
  exchange_rate: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectDto {
  name: string;
  status?: ProjectStatus;
  built_area?: number;
  exchange_rate?: number;
}

export interface UpdateProjectDto {
  name: string;
  status?: ProjectStatus;
  built_area?: number;
  exchange_rate?: number;
}
