import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { RegistroComponent } from './registro/registro';
import { DashboardComponent } from './dashboard/dashboard';
import { EquiposComponent } from './equipos/equipos';
import { PartidosComponent } from './partidos/partidos';
import { EstadisticasComponent } from './estadisticas/estadisticas';
import { MercadoComponent } from './mercado/mercado';
import { MensajesComponent } from './mensajes/mensajes';
import { AdminComponent } from './admin/admin';
import { MiPerfilComponent } from './mi-perfil/mi-perfil';
import { MiEquipoComponent } from './mi-equipo/mi-equipo';
import { ClasificacionComponent } from './clasificacion/clasificacion';
import { PlayoffsComponent } from './playoffs/playoffs';
import { PagoExitoComponent } from './pago-exito/pago-exito';
import { PagoCanceladoComponent } from './pago-cancelado/pago-cancelado';
import { authGuard } from './auth-guard';
import { adminGuard } from './admin-guard';

export const routes: Routes = [
  // Rutas públicas
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'pago-exito', component: PagoExitoComponent },
  { path: 'pago-cancelado', component: PagoCanceladoComponent },

  // Rutas privadas normales
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'clasificacion', component: ClasificacionComponent, canActivate: [authGuard] },
  { path: 'equipos', component: EquiposComponent, canActivate: [authGuard] },
  { path: 'partidos', component: PartidosComponent, canActivate: [authGuard] },
  { path: 'estadisticas', component: EstadisticasComponent, canActivate: [authGuard] },
  { path: 'mercado', component: MercadoComponent, canActivate: [authGuard] },
  { path: 'mensajes', component: MensajesComponent, canActivate: [authGuard] },

  // Rutas por rol
  { path: 'mi-perfil', component: MiPerfilComponent, canActivate: [authGuard] },
  { path: 'mi-equipo', component: MiEquipoComponent, canActivate: [authGuard] },

  { path: 'playoffs', component: PlayoffsComponent, canActivate: [authGuard] },

  // Ruta VIP solo Admin
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },

  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
