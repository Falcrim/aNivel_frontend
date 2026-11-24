/**
 * Estructura estándar de respuestas paginadas devuelta por Django REST Framework (PageNumberPagination).
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
