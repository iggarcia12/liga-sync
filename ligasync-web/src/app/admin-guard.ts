import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAdmin()) {
    return true; 
  } else {
    alert("¡Acceso Denegado! Solo administradores pueden entrar aquí.");
    router.navigate(['/dashboard']);
    return false;
  }
};
