import { HttpErrorResponse, HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { extractHttpErrorMessage } from '../utils/error.utils';

/**
 * Token de contexto para omitir la notificación automática de error vía Toast si una llamada específica lo requiere.
 */
export const SKIP_GLOBAL_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/**
 * Interceptor funcional global que captura errores HTTP de Django REST Framework o de red,
 * extrayendo un mensaje legible y mostrándolo de forma centralizada al usuario vía ToastService.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const skipToast = req.context.get(SKIP_GLOBAL_ERROR_TOAST);

      if (!skipToast) {
        let title = 'Error en el servidor';
        if (error instanceof HttpErrorResponse) {
          if (error.status === 0) {
            title = 'Error de conexión';
          } else if (error.status === 400) {
            title = 'Datos inválidos';
          } else if (error.status === 404) {
            title = 'Recurso no encontrado';
          } else if (error.status >= 500) {
            title = 'Error interno del servidor';
          }
        }

        const message = extractHttpErrorMessage(error);
        toastService.error(title, message);
      }

      return throwError(() => error);
    })
  );
};
