export type SupplierType = 'material' | 'labor' | 'both';

export interface Supplier {
  id: number;
  name: string;
  supplier_type: SupplierType;
  supplier_type_display: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  photo?: string | null;
  photo_url?: string | null;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSupplierDto {
  name: string;
  supplier_type: SupplierType;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  photo?: File | null;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}
