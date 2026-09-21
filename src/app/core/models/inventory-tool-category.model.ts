export interface ToolCategory {
  id: number;
  name: string;
  description: string | null;
  tools_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateToolCategoryDto {
  name: string;
  description?: string | null;
}

export interface UpdateToolCategoryDto extends Partial<CreateToolCategoryDto> {}
