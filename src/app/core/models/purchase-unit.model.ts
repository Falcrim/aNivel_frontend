export interface PurchaseUnit {
  id: number;
  name: string;
  abbreviation: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePurchaseUnitDto {
  name: string;
  abbreviation: string;
}

export interface UpdatePurchaseUnitDto {
  name: string;
  abbreviation: string;
}
