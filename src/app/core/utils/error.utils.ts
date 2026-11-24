/**
 * Extrae de forma segura y consistente un mensaje de error legible para el usuario
 * a partir de respuestas HttpErrorResponse de Django REST Framework o errores genéricos.
 * Filtra proactivamente páginas HTML de depuración, trazas técnicas y códigos de estado internos.
 */
export function extractHttpErrorMessage(err: unknown): string {
  if (!err) return 'Error desconocido';

  const errorObj = err as {
    error?: unknown;
    message?: string;
  };

  if (errorObj.error) {
    if (typeof errorObj.error === 'string') {
      const errStr = errorObj.error.trim();
      // Si la respuesta es una página HTML de error (Django debug, nginx, proxy, etc.)
      if (
        errStr.startsWith('<!DOCTYPE') ||
        errStr.startsWith('<html') ||
        errStr.includes('<body') ||
        errStr.includes('Traceback (most recent call last)')
      ) {
        return 'Ha ocurrido un error en el servidor. Por favor intenta nuevamente más tarde.';
      }
      return errStr;
    }

    if (typeof errorObj.error === 'object' && errorObj.error !== null) {
      const errorMap = errorObj.error as Record<string, unknown>;

      if (errorMap['detail'] && typeof errorMap['detail'] === 'string') {
        return errorMap['detail'];
      }

      if (errorMap['message'] && typeof errorMap['message'] === 'string') {
        return errorMap['message'];
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

      // Concatenar mensajes de campos si vienen como objeto clave -> [errores],
      // excluyendo claves de metadatos internos como 'code', 'status_code' o 'count'.
      const ignoredKeys = new Set(['code', 'status_code', 'count']);
      const fieldErrors = Object.entries(errorMap)
        .filter(([field]) => !ignoredKeys.has(field))
        .map(([field, msgs]) => {
          const formattedMsgs = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          return `${field}: ${formattedMsgs}`;
        })
        .join(' | ');

      if (fieldErrors) return fieldErrors;

      return 'Ha ocurrido un error en el procesamiento de la solicitud.';
    }
  }

  if (errorObj.message) {
    // Si contiene texto técnico de Angular Http failure
    if (errorObj.message.includes('Http failure response')) {
      return 'No fue posible conectar con el servidor. Verifica tu conexión a internet o intenta más tarde.';
    }
    return errorObj.message;
  }

  return 'Error de conexión con el servidor';
}
