import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

interface IncidenciaItem {
  jugadorId: number;
  nombre: string;
  equipo: 'local' | 'visitante';
  tipo: string;
}

@Component({
  selector: 'app-partidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partidos.html',
  styleUrl: './partidos.css'
})
export class PartidosComponent implements OnInit {
  readonly urlBase = 'http://localhost:8080/api';

  partidos: any[] = [];
  cargando = true;

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

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  get esAdmin(): boolean { return this.authService.isAdmin(); }
  get esArbitro(): boolean { return this.authService.isArbitro(); }
  get puedeGestionarActas(): boolean { return this.esAdmin || this.esArbitro; }

  ngOnInit() {
    this.cargarPartidos();
  }

  cargarPartidos() {
    this.http.get<any[]>(`${this.urlBase}/partidos`).subscribe({
      next: (datos) => {
        this.partidos = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar los partidos', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

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
      incidencias: this.incidencias.map(i => ({ jugadorId: i.jugadorId, tipo: i.tipo }))
    };

    this.http.put<any>(`${this.urlBase}/partidos/${this.partidoEnActa.id}/resultado`, body).subscribe({
      next: (partidoActualizado) => {
        const idx = this.partidos.findIndex(p => p.id === this.partidoEnActa.id);
        if (idx !== -1) this.partidos[idx] = partidoActualizado;
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

  anadirIncidencia(jugador: any, equipo: 'local' | 'visitante', tipo: string) {
    this.incidencias.push({ jugadorId: jugador.id, nombre: jugador.nombre, equipo, tipo });
  }

  quitarIncidencia(index: number) {
    this.incidencias.splice(index, 1);
  }

  contarIncidencias(jugadorId: number, tipo: string): number {
    return this.incidencias.filter(i => i.jugadorId === jugadorId && i.tipo === tipo).length;
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
      incidencias: this.incidencias.map(i => ({ jugadorId: i.jugadorId, tipo: i.tipo }))
    };

    this.http.put<any>(`${this.urlBase}/partidos/${this.partidoEnActa.id}/firmar`, body).subscribe({
      next: (partidoActualizado) => {
        const idx = this.partidos.findIndex(p => p.id === this.partidoEnActa.id);
        if (idx !== -1) this.partidos[idx] = partidoActualizado;
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
    const iconos: Record<string, string> = { GOL: '⚽', ASIST: '🎯', AMARILLA: '🟨', ROJA: '🟥' };
    return iconos[tipo] ?? '📋';
  }

  esFirmado(partido: any): boolean {
    return partido.estado === 'FINALIZADO_Y_FIRMADO';
  }
}
