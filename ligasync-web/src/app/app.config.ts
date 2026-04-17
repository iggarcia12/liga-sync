import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // <-- Añadir withInterceptors
import { authInterceptor } from './auth-interceptor'; // <-- Importar el mayordomo

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Contratamos al mayordomo para que intercepte todas las llamadas HTTP
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};