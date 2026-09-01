export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUnitOfMeasureDto {
  name: string;
  abbreviation: string;
}

export interface UpdateUnitOfMeasureDto {
  name: string;
  abbreviation: string;
}
