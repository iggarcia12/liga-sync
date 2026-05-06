import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {

  readonly urlBase = environment.apiUrl + '/api';
  tabActiva: string = 'usuarios';
  partidoConvocatoria: any = null;
  jugadoresLocalConv: any[] = [];
  jugadoresVisitanteConv: any[] = [];
  cargandoConvJugadores = false;

  get partidosPendientes(): any[] {
    return this.partidos.filter(p => p.estado !== 'FINALIZADO_Y_FIRMADO');
  }
  usuarios: any[] = [];
  partidos: any[] = [];
  equipos: any[] = [];
  cargandoUsuarios: boolean = true;
  cargandoPartidos: boolean = true;

  metricas = {
    totalUsuarios: 0,
    partidosJugados: 0,
    equiposRegistrados: 0
  };

  rolesDisponibles = ['espectador', 'jugador', 'entrenador', 'arbitro', 'admin'];
  rangosPendientes: { [userId: number]: { role: string; teamId: number | null; jugadorId: number | null } } = {};
  jugadoresSinUsuario: any[] = [];
  mensajeRango = '';
  mensajeRangoError = '';
  busquedaUsuario: string = '';

  get usuariosFiltrados(): any[] {
    const filtro = this.busquedaUsuario.trim().toLowerCase();
    if (!filtro) return this.usuarios;
    return this.usuarios.filter(u => u.nombre?.toLowerCase().includes(filtro));
  }

  // Estado del editor de resultados (pantalla completa)
  editorActivo: boolean = false;
  partidoEditando: any = null;
  golesLocal: number = 0;
  golesVisitante: number = 0;
  incidencias: any[] = []; // { jugadorId: number, tipo: string }
  jugadoresLocal: any[] = [];
  jugadoresVisitante: any[] = [];

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. Cargar usuarios
    this.http.get<any[]>(this.urlBase + '/usuarios').subscribe({
      next: (datos) => {
        this.usuarios = datos;
        this.metricas.totalUsuarios = datos.length;
        this.cargandoUsuarios = false;
        // Inicializar estado editable por usuario
        datos.forEach(u => {
          this.rangosPendientes[u.id] = {
            role: u.role ?? 'espectador',
            teamId: u.teamId ?? null,
            jugadorId: u.jugadorId ?? null
          };
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoUsuarios = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Cargar partidos
    this.http.get<any[]>(this.urlBase + '/partidos').subscribe(datos => {
      this.partidos = datos.sort((a, b) => (a.jornada || 0) - (b.jornada || 0));
      this.metricas.partidosJugados = datos.filter(
        p => p.golesLocal !== null && p.golesLocal !== undefined
      ).length;
      this.cargandoPartidos = false;
      this.cdr.detectChanges();
    });

    // 3. Cargar equipos
    this.http.get<any[]>(this.urlBase + '/equipos').subscribe(datos => {
      this.equipos = datos;
      this.metricas.equiposRegistrados = datos.length;
      this.cdr.detectChanges();
    });

    // 4. Cargar jugadores disponibles (sin usuario vinculado)
    this.http.get<any[]>(this.urlBase + '/jugadores/sin-usuario').subscribe({
      next: (datos) => {
        this.jugadoresSinUsuario = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar jugadores sin usuario:', err)
    });
  }

  activarTab(tab: string) {
    this.tabActiva = tab;
    if (tab !== 'convocatoria') this.partidoConvocatoria = null;
    this.cdr.detectChanges();
  }

  abrirConvocatoriaPartido(partido: any) {
    this.partidoConvocatoria = partido;
    this.jugadoresLocalConv = [];
    this.jugadoresVisitanteConv = [];
    this.cargandoConvJugadores = true;

    let pendientes = (partido.local?.id ? 1 : 0) + (partido.visitante?.id ? 1 : 0);
    const check = () => { if (--pendientes === 0) { this.cargandoConvJugadores = false; this.cdr.detectChanges(); } };

    if (partido.local?.id) {
      this.http.get<any[]>(`${this.urlBase}/jugadores/equipo/${partido.local.id}`).subscribe({
        next: (j) => { this.jugadoresLocalConv = j; check(); },
        error: (err) => { console.error('Error al cargar jugadores locales:', err); check(); }
      });
    }
    if (partido.visitante?.id) {
      this.http.get<any[]>(`${this.urlBase}/jugadores/equipo/${partido.visitante.id}`).subscribe({
        next: (j) => { this.jugadoresVisitanteConv = j; check(); },
        error: (err) => { console.error('Error al cargar jugadores visitantes:', err); check(); }
      });
    }
  }

  volverListaConvocatoria() {
    this.partidoConvocatoria = null;
  }

  toggleConvocatoria(jugador: any) {
    const nuevoEstado = !jugador.convocado;
    if (nuevoEstado && jugador.estadoDisciplinario === 'SANCIONADO') return;
    this.http.put<any>(`${this.urlBase}/jugadores/${jugador.id}/convocatoria`, { convocado: nuevoEstado }).subscribe({
      next: (actualizado) => { jugador.convocado = actualizado.convocado; this.cdr.detectChanges(); },
      error: (err) => console.error('Error al cambiar convocatoria:', err)
    });
  }

  marcarTodoConv(jugadores: any[], asiste: boolean) {
    jugadores.filter(j => !asiste || j.estadoDisciplinario !== 'SANCIONADO').forEach(j => {
      this.http.put<any>(`${this.urlBase}/jugadores/${j.id}/convocatoria`, { convocado: asiste }).subscribe({
        next: (actualizado) => { j.convocado = actualizado.convocado; this.cdr.detectChanges(); },
        error: (err) => console.error('Error al marcar convocatoria en bloque:', err)
      });
    });
  }

  generarCalendario() {
    if (confirm('¿Estás seguro? Esto ELIMINARÁ todos los partidos actuales y creará un nuevo calendario de ida y vuelta.')) {
      this.http.post(this.urlBase + '/partidos/generar-calendario', {}).subscribe({
        next: () => {
          alert('¡Calendario generado con éxito!');
          this.cargarDatos();
        },
        error: () => alert('Error al generar calendario. Asegúrate de tener al menos 2 equipos.')
      });
    }
  }

  abrirModalResultado(partido: any) {
    this.partidoEditando = partido;
    this.golesLocal = partido.golesLocal || 0;
    this.golesVisitante = partido.golesVisitante || 0;
    this.incidencias = [];
    this.editorActivo = true;

    // Cargar jugadores de ambos equipos para las incidencias
    if (partido.local?.id) {
      this.http.get<any[]>(this.urlBase + `/jugadores/equipo/${partido.local.id}`).subscribe(datos => {
        this.jugadoresLocal = datos;
        this.cdr.detectChanges();
      });
    }
    if (partido.visitante?.id) {
      this.http.get<any[]>(this.urlBase + `/jugadores/equipo/${partido.visitante.id}`).subscribe(datos => {
        this.jugadoresVisitante = datos;
        this.cdr.detectChanges();
      });
    }
  }

  cerrarModal() {
    this.editorActivo = false;
    this.partidoEditando = null;
  }

  agregarIncidencia(jugadorId: any, tipo: string) {
    if (!jugadorId) return;
    this.incidencias.push({ jugadorId: parseInt(jugadorId, 10), tipo });
  }

  quitarIncidencia(index: number) {
    this.incidencias.splice(index, 1);
  }

  guardarResultado() {
    const payload = {
      golesLocal: this.golesLocal,
      golesVisitante: this.golesVisitante,
      incidencias: this.incidencias
    };

    this.http.put(`${this.urlBase}/partidos/${this.partidoEditando.id}/resultado`, payload).subscribe({
      next: () => {
        alert('Resultado registrado correctamente. Estadísticas actualizadas.');
        this.cerrarModal();
        this.cargarDatos();
      },
      error: () => alert('Error al guardar el resultado.')
    });
  }

  eliminarPartido(id: number) {
    if (confirm('¿Eliminar este partido?')) {
      this.http.delete(this.urlBase + '/partidos/' + id).subscribe(() => {
        this.partidos = this.partidos.filter(p => p.id !== id);
        this.cdr.detectChanges();
      });
    }
  }

  getNombreJugador(id: number): string {
    const j = [...this.jugadoresLocal, ...this.jugadoresVisitante].find(item => item.id === id);
    return j ? j.nombre : 'Jugador';
  }

  eliminarUsuario(id: number) {
    if (confirm('ATENCIÓN: ¿Estás seguro de que deseas eliminar a este usuario permanentemente?')) {
      this.http.delete(this.urlBase + '/usuarios/' + id).subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.id !== id);
          this.metricas.totalUsuarios = this.usuarios.length;
          this.cdr.detectChanges();
          alert('Usuario eliminado correctamente.');
        },
        error: () => {
          alert('Error al eliminar el usuario. Inténtalo de nuevo.');
        }
      });
    }
  }

  requiereEquipo(role: string): boolean {
    return role === 'entrenador';
  }

  requiereJugador(role: string): boolean {
    return role === 'jugador';
  }

  guardarRango(usuario: any) {
    const rango = this.rangosPendientes[usuario.id];
    if (!rango) return;

    const body = {
      role: rango.role,
      teamId: this.requiereEquipo(rango.role) ? rango.teamId : null,
      jugadorId: rango.role === 'jugador' ? rango.jugadorId : null
    };

    this.http.put<any>(`${this.urlBase}/usuarios/${usuario.id}/rango`, body).subscribe({
      next: (actualizado) => {
        const idx = this.usuarios.findIndex(u => u.id === usuario.id);
        if (idx !== -1) this.usuarios[idx] = actualizado;
        this.mensajeRango = `Rango de "${usuario.nombre}" actualizado correctamente.`;
        this.mensajeRangoError = '';
        setTimeout(() => this.mensajeRango = '', 3500);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar rango:', err);
        this.mensajeRangoError = 'Error al actualizar el rango. Inténtalo de nuevo.';
        this.mensajeRango = '';
        this.cdr.detectChanges();
      }
    });
  }

  get equiposPagados(): number {
    return this.equipos.filter(e => e.cuotaPagada).length;
  }

  get equiposPendientes(): number {
    return this.equipos.filter(e => !e.cuotaPagada).length;
  }

  marcarCuotaPagada(equipo: any) {
    this.http.patch(`${this.urlBase}/pagos/confirmar-cuota/${equipo.id}`, {}).subscribe({
      next: () => {
        equipo.cuotaPagada = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al marcar cuota como pagada:', err)
    });
  }

  resetearCuota(equipo: any) {
    if (!confirm(`¿Resetear la cuota de "${equipo.nombre}"? El equipo tendrá que volver a pagar.`)) return;
    this.http.patch(`${this.urlBase}/pagos/resetear-cuota/${equipo.id}`, {}).subscribe({
      next: () => {
        equipo.cuotaPagada = false;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al resetear cuota:', err)
    });
  }

  getRolClass(rol: string): string {
    if (!rol) return 'badge-espectador';
    const r = rol.toUpperCase();
    if (r === 'ADMIN')      return 'badge-admin';
    if (r === 'ENTRENADOR') return 'badge-entrenador';
    if (r === 'JUGADOR')    return 'badge-jugador';
    return 'badge-espectador';
  }

  getInitial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  esUrl(texto: string): boolean {
    if (!texto) return false;
    // Es URL si empieza por http, contiene barras o tiene una extensión de imagen común
    const regexImagen = /\.(jpg|jpeg|png|gif|svg|webp|avif)(?:\?.*)?$/i;
    return texto.startsWith('http') || 
           texto.startsWith('https') || 
           texto.includes('/') || 
           texto.includes('data:image') ||
           regexImagen.test(texto);
  }

  onImageError(event: any) {
    // Si la imagen falla, la ocultamos y mostramos el span de respaldo
    event.target.style.display = 'none';
    const fallback = event.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = 'inline-block';
    }
  }
}
