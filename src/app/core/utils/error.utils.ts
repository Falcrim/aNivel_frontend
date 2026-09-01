/**
 * Extrae de forma segura y consistente un mensaje de error legible para el usuario
 * a partir de respuestas HttpErrorResponse de Django REST Framework o errores genéricos.
 */
export function extractHttpErrorMessage(err: unknown): string {
  if (!err) return 'Error desconocido';

  const errorObj = err as {
    error?: unknown;
    message?: string;
  };

  if (errorObj.error) {
    if (typeof errorObj.error === 'string') {
      return errorObj.error;
    }

    if (typeof errorObj.error === 'object' && errorObj.error !== null) {
      const errorMap = errorObj.error as Record<string, unknown>;

      if (errorMap['detail'] && typeof errorMap['detail'] === 'string') {
        return errorMap['detail'];
      }

      if (errorMap['name']) {
        return Array.isArray(errorMap['name'])
          ? errorMap['name'].join(', ')
          : String(errorMap['name']);
      }

      if (errorMap['non_field_errors']) {
        return Array.isArray(errorMap['non_field_errors'])
          ? errorMap['non_field_errors'].join(', ')
          : String(errorMap['non_field_errors']);
      }

      // Concatenar mensajes de campos si vienen como objeto clave -> [errores]
      const fieldErrors = Object.entries(errorMap)
        .map(([field, msgs]) => {
          const formattedMsgs = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          return `${field}: ${formattedMsgs}`;
        })
        .join(' | ');

      if (fieldErrors) return fieldErrors;

      return JSON.stringify(errorObj.error);
    }
  }

  return errorObj.message || 'Error de conexión con el servidor';
}
