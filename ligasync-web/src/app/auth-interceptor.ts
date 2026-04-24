import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const miToken = localStorage.getItem('token');

  let peticionFinal = req;

  const esLogin = req.url.includes('/api/login') || req.url.includes('/api/auth/registro');
  if (miToken && !esLogin) {
    peticionFinal = req.clone({
      setHeaders: {
        Authorization: 'Bearer ' + miToken
      }
    });
  }

  return next(peticionFinal).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token caducado o corrupto: sesión fuera
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }
      
      if (error.status === 403) {
        // El token vale pero el rol no. Solo avisamos por consola, la UI lo gestionará.
        console.warn('Acceso denegado: permisos insuficientes.');
      }
      
      return throwError(() => error);
    })
  );
};