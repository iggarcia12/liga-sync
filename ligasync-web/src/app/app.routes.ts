import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { EquiposComponent } from './equipos/equipos';
import { PartidosComponent } from './partidos/partidos';
import { EstadisticasComponent } from './estadisticas/estadisticas';
import { MercadoComponent } from './mercado/mercado';
import { MensajesComponent } from './mensajes/mensajes';
import { AdminComponent } from './admin/admin'; // <-- Componente del Panel de Control
import { authGuard } from './auth-guard';
import { adminGuard } from './admin-guard'; // <-- Guardia para Roles

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  // Rutas privadas normales
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'equipos', component: EquiposComponent, canActivate: [authGuard] },
  { path: 'partidos', component: PartidosComponent, canActivate: [authGuard] },
  { path: 'estadisticas', component: EstadisticasComponent, canActivate: [authGuard] },
  { path: 'mercado', component: MercadoComponent, canActivate: [authGuard] },
  { path: 'mensajes', component: MensajesComponent, canActivate: [authGuard] },
  
  // Ruta VIP (Requiere estar logueado Y ser administrador)
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
  
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];