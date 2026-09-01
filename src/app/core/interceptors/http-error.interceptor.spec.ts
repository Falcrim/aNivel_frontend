import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, HttpContext } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { httpErrorInterceptor, SKIP_GLOBAL_ERROR_TOAST } from './http-error.interceptor';
import { ToastService } from '../services/toast.service';

describe('HttpErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let toastService: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ToastService,
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  it('should intercept 400 error and show toast', () => {
    httpClient.get('/api/test').subscribe({
      next: () => expect.unreachable('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(400);
      },
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ detail: 'Parámetros inválidos' }, { status: 400, statusText: 'Bad Request' });

    const toasts = toastService.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].title).toBe('Datos inválidos');
    expect(toasts[0].message).toBe('Parámetros inválidos');
  });

  it('should allow skipping global toast via context token', () => {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true);

    httpClient.get('/api/custom-error', { context }).subscribe({
      next: () => expect.unreachable('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      },
    });

    const req = httpTestingController.expectOne('/api/custom-error');
    req.flush({ detail: 'Error de servidor' }, { status: 500, statusText: 'Server Error' });

    const toasts = toastService.toasts();
    expect(toasts.length).toBe(0);
  });
});
