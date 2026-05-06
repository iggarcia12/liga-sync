import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

interface IncidenciaItem {
  jugadorId: number;
  nombre: string;
  equipo: 'local' | 'visitante';
  tipo: string;
  valorAnotacion?: number;
}

@Component({
  selector: 'app-playoffs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playoffs.html',
  styleUrl: './playoffs.css'
})
export class PlayoffsComponent implements OnInit {
  todosPartidos: any[] = [];
  cargando = true;
  error = false;

  // --- Estado del modal de acta ---
  partidoEnActa: any = null;
  jugadoresLocal: any[] = [];
  jugadoresVisitante: any[] = [];
  golesLocalActa = 0;
  golesVisitanteActa = 0;
  mvpIdActa: number | null = null;
  incidencias: IncidenciaItem[] = [];
  todosLosJugadores: any[] = [];
  mostrarConfirmacion = false;
  firmando = false;
  guardandoResultado = false;
  mensajeErrorActa = '';
  descargandoActa: Record<number, boolean> = {};

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  readonly urlBase = environment.apiUrl + '/api';

  get esAdmin(): boolean { return this.authService.isAdmin(); }
  get esArbitro(): boolean { return this.authService.isArbitro(); }
  get puedeGestionarActas(): boolean { return this.esAdmin || this.esArbitro; }

  ngOnInit() {
    this.cargarPartidos();
  }

  cargarPartidos() {
    this.cargando = true;
    this.http.get<any[]>(`${this.urlBase}/partidos`).subscribe({
      next: (data) => {
        this.todosPartidos = data.filter(p => p.tipoPartido && p.tipoPartido !== 'REGULAR');
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando play-offs:', err);
        this.error = true;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  getPartido(codigo: string): any | null {
    return this.todosPartidos.find(p => p.codigoEliminatoria === codigo) ?? null;
  }

  get c1(): any { return this.getPartido('CUARTOS_1'); }
  get c2(): any { return this.getPartido('CUARTOS_2'); }
  get c3(): any { return this.getPartido('CUARTOS_3'); }
  get c4(): any { return this.getPartido('CUARTOS_4'); }
  get s1(): any { return this.getPartido('SEMI_1'); }
  get s2(): any { return this.getPartido('SEMI_2'); }
  get f():  any { return this.getPartido('FINAL'); }

  get hayPlayoffs(): boolean { return this.todosPartidos.length > 0; }

  nombre(p: any, lado: 'local' | 'visitante'): string {
    return p?.[lado]?.nombre ?? 'Por determinar';
  }

  goles(p: any, lado: 'local' | 'visitante'): string {
    const g = lado === 'local' ? p?.golesLocal : p?.golesVisitante;
    return g !== null && g !== undefined ? String(g) : '-';
  }

  finalizado(p: any): boolean {
    return p?.estado === 'FINALIZADO_Y_FIRMADO';
  }

  ganador(p: any, lado: 'local' | 'visitante'): boolean {
    if (!this.finalizado(p)) return false;
    const gl = p.golesLocal ?? 0, gv = p.golesVisitante ?? 0;
    return lado === 'local' ? gl > gv : gv > gl;
  }

  get campeon(): string | null {
    if (!this.finalizado(this.f)) return null;
    return this.ganador(this.f, 'local') ? this.f.local?.nombre : this.f.visitante?.nombre;
  }

  etiqueta(p: any): string {
    const m: Record<string, string> = {
      CUARTOS_1: '1° vs 8°', CUARTOS_2: '4° vs 5°',
      CUARTOS_3: '2° vs 7°', CUARTOS_4: '3° vs 6°',
      SEMI_1: 'Semifinal A', SEMI_2: 'Semifinal B',
      FINAL: 'Gran Final'
    };
    return m[p?.codigoEliminatoria] ?? '';
  }

  // --- Métodos de gestión de actas ---

  abrirActa(partido: any) {
    this.partidoEnActa = partido;
    this.golesLocalActa = partido.golesLocal ?? 0;
    this.golesVisitanteActa = partido.golesVisitante ?? 0;
    this.mvpIdActa = partido.mvpId ?? null;
    this.incidencias = [];
    this.mostrarConfirmacion = false;
    this.jugadoresLocal = [];
    this.jugadoresVisitante = [];

    const localId = partido.local?.id;
    const visitanteId = partido.visitante?.id;

    if (localId) {
      this.http.get<any[]>(`${this.urlBase}/jugadores/equipo/${localId}`).subscribe({
        next: (j) => {
          this.jugadoresLocal = j.filter(p => p.convocado && p.estadoDisciplinario !== 'SANCIONADO');
          this.actualizarTodosLosJugadores();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al cargar jugadores locales', err)
      });
    }
    if (visitanteId) {
      this.http.get<any[]>(`${this.urlBase}/jugadores/equipo/${visitanteId}`).subscribe({
        next: (j) => {
          this.jugadoresVisitante = j.filter(p => p.convocado && p.estadoDisciplinario !== 'SANCIONADO');
          this.actualizarTodosLosJugadores();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al cargar jugadores visitantes', err)
      });
    }
  }

  guardarSinFirmar() {
    if (!this.partidoEnActa || this.guardandoResultado) return;
    this.guardandoResultado = true;

    const body = {
      golesLocal: this.golesLocalActa,
      golesVisitante: this.golesVisitanteActa,
      incidencias: this.incidencias.map(i => ({ jugadorId: i.jugadorId, tipo: i.tipo, valorAnotacion: i.valorAnotacion }))
    };

    this.http.put<any>(`${this.urlBase}/partidos/${this.partidoEnActa.id}/resultado`, body).subscribe({
      next: (partidoActualizado) => {
        const idx = this.todosPartidos.findIndex(p => p.id === this.partidoEnActa.id);
        if (idx !== -1) this.todosPartidos[idx] = partidoActualizado;
        this.guardandoResultado = false;
        this.cerrarActa();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al guardar el resultado sin firmar', err);
        this.guardandoResultado = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarActa() {
    this.partidoEnActa = null;
    this.jugadoresLocal = [];
    this.jugadoresVisitante = [];
    this.todosLosJugadores = [];
    this.incidencias = [];
    this.mostrarConfirmacion = false;
    this.firmando = false;
    this.guardandoResultado = false;
    this.mensajeErrorActa = '';
  }

  anadirIncidencia(jugador: any, equipo: 'local' | 'visitante', tipo: string, valorAnotacion?: number) {
    this.incidencias.push({ jugadorId: jugador.id, nombre: jugador.nombre, equipo, tipo, valorAnotacion });
  }

  quitarIncidencia(index: number) {
    this.incidencias.splice(index, 1);
  }

  contarIncidencias(jugadorId: number, tipo: string, valorAnotacion?: number): number {
    return this.incidencias.filter(i =>
      i.jugadorId === jugadorId &&
      i.tipo === tipo &&
      (valorAnotacion === undefined || i.valorAnotacion === valorAnotacion)
    ).length;
  }

  incidenciaEtiqueta(inc: IncidenciaItem): string {
    switch (inc.tipo) {
      case 'GOL':      return '⚽';
      case 'PUNTOS':
        if (inc.valorAnotacion === 2) return '🏀 +2 pts (Canasta)';
        if (inc.valorAnotacion === 3) return '🏀 +3 pts';
        return '🏀 +1 pt (T. Libre)';
      case 'TRIPLE':   return '🏀 +3 pts (Triple)';
      case 'REBOTE':   return '🔄 Rebote';
      case 'ASIST':    return '🎯';
      case 'AMARILLA': return '🟨';
      case 'ROJA':     return '🟥';
      default:         return '📋';
    }
  }

  private actualizarTodosLosJugadores() {
    this.todosLosJugadores = [
      ...this.jugadoresLocal.map(j => ({ ...j, equipoLabel: this.partidoEnActa?.local?.nombre })),
      ...this.jugadoresVisitante.map(j => ({ ...j, equipoLabel: this.partidoEnActa?.visitante?.nombre }))
    ];
  }

  firmarActa() {
    if (!this.partidoEnActa || this.firmando) return;
    this.firmando = true;

    const body = {
      golesLocal: this.golesLocalActa,
      golesVisitante: this.golesVisitanteActa,
      mvpId: this.mvpIdActa,
      asistentesIds: [],
      incidencias: this.incidencias.map(i => ({ jugadorId: i.jugadorId, tipo: i.tipo, valorAnotacion: i.valorAnotacion }))
    };

    this.http.put<any>(`${this.urlBase}/partidos/${this.partidoEnActa.id}/firmar`, body).subscribe({
      next: (partidoActualizado) => {
        const idx = this.todosPartidos.findIndex(p => p.id === this.partidoEnActa.id);
        if (idx !== -1) this.todosPartidos[idx] = partidoActualizado;
        this.firmando = false;
        this.cerrarActa();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al firmar el acta', err);
        const detalle = typeof err.error === 'string' ? err.error : (err.error?.message ?? `Error ${err.status}`);
        this.mensajeErrorActa = detalle;
        this.firmando = false;
        this.mostrarConfirmacion = false;
        this.cdr.detectChanges();
      }
    });
  }

  tipoIcono(tipo: string): string {
    const iconos: Record<string, string> = { GOL: this.authService.esBaloncesto() ? '🏀' : '⚽', ASIST: '🎯', AMARILLA: '🟨', ROJA: '🟥' };
    return iconos[tipo] ?? '📋';
  }

  descargarActa(partidoId: number) {
    if (this.descargandoActa[partidoId]) return;
    this.descargandoActa[partidoId] = true;

    this.http.get(`${this.urlBase}/partidos/${partidoId}/acta-pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `acta_partido_${partidoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.descargandoActa[partidoId] = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Error al descargar el acta del partido #${partidoId}`, err);
        this.descargandoActa[partidoId] = false;
        this.cdr.detectChanges();
      }
    });
  }
}
