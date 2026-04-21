import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const miToken = localStorage.getItem('token');

  let peticionFinal = req;

  // 1. Si hay token y no es una petición de login, lo pegamos en la cabecera
  const esLogin = req.url.includes('/api/login') || req.url.includes('/api/auth/registro');
  if (miToken && !esLogin) {
    peticionFinal = req.clone({
      setHeaders: {
        Authorization: 'Bearer ' + miToken
      }
    });
  }

  // 2. Dejamos salir la petición, pero nos quedamos "escuchando" si vuelve con error
  return next(peticionFinal).pipe(
    catchError((error: HttpErrorResponse) => {
      // 3. 401: Token caducado o inválido. Echar al usuario.
      if (error.status === 401) {
        console.warn('El token ha caducado o es inválido. Redirigiendo al login...');
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }
      // Si es 403 (Prohibido/Forbidden), significa de que el token vale, pero no tiene Permisos o Rol de Admin.
      // Se lo pasamos al componente para que muestre una alerta amigable.
      if (error.status === 403) {
        console.warn('Acceso denegado: El usuario no tiene suficientes permisos (Rol) para esta acción.');
      }
      return throwError(() => error);
    })
  );
};