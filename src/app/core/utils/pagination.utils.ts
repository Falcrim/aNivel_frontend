import { PaginatedResponse } from '../models/pagination.model';

/**
 * Normaliza respuestas HTTP que pueden llegar como arreglo directo T[] (sin paginar)
 * o dentro de la estructura estándar PaginatedResponse<T> de Django REST Framework.
 *
 * @param response Arreglo plano o respuesta con metadatos de paginación { count, results, ... }
 * @returns Objeto consistente { items: T[], totalCount: number }
 */
export function extractResults<T>(
  response: PaginatedResponse<T> | T[] | null | undefined
): { items: T[]; totalCount: number } {
  if (!response) {
    return { items: [], totalCount: 0 };
  }

  if (Array.isArray(response)) {
    return { items: response, totalCount: response.length };
  }

  return {
    items: Array.isArray(response.results) ? response.results : [],
    totalCount: typeof response.count === 'number' ? response.count : (response.results?.length ?? 0),
  };
}
