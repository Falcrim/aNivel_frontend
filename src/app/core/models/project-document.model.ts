export type DocumentType =
  | 'quotation'
  | 'technical_sheet'
  | 'blueprint'
  | 'other';

export type DocumentCurrency = 'BOB' | 'USD';

export interface ProjectDocument {
  id: number;
  project: number;
  project_name: string;
  title: string;
  document_type: DocumentType;
  document_type_display: string;
  file?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_size_formatted: string;
  file_extension: string;
  supplier_name: string;
  quoted_amount: number | string | null;
  currency: DocumentCurrency;
  subcategory: number | null;
  subcategory_name: string;
  notes: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectDocumentSummary {
  project_id: number;
  total_documents: number;
  quotations_count: number;
  technical_sheets_count: number;
  blueprints_count: number;
  others_count: number;
  total_quoted_bob: number;
  total_quoted_usd: number;
}

export interface UploadProjectDocumentDto {
  project: number;
  title: string;
  document_type: DocumentType;
  file: File;
  supplier_name?: string;
  quoted_amount?: number | null;
  currency?: DocumentCurrency;
  subcategory?: number | null;
  notes?: string;
}
