import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // 1. El portero mira si hay llave en la caja fuerte
  const miToken = localStorage.getItem('token');

  // 2. Si hay llave, le abre la puerta
  if (miToken) {
    return true; 
  } else {
    // 3. Si no hay llave, lo manda directo al Login y bloquea la puerta
    router.navigate(['/login']);
    return false;
  }
};