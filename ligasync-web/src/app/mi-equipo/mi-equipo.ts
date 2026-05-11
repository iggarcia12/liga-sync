import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './mi-equipo.html',
  styleUrl: './mi-equipo.css'
})
export class MiEquipoComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  equipo: any = null;
  jugadores: any[] = [];
  cargando = true;
  editando = false;
  mensajeGuardado = '';

  miJugador: any = null;
  proximoPartido: any = null;

  get esJugador(): boolean { return this.authService.isJugador() || !!this.authService.getJugadorId(); }
  get esEntrenador(): boolean { return this.authService.isEntrenador(); }

  deporteLiga: 'FUTBOL' | 'BALONCESTO' = this.authService.getDeporte();
  get esBaloncesto(): boolean { return this.deporteLiga === 'BALONCESTO'; }

  sortField: string = 'pos';
  sortDirection: 'asc' | 'desc' = 'asc';

  nombreEdicion = '';
  escudoEdicion = '';

  pestanaActiva: 'plantilla' | 'ofertas' | 'tactica' | 'convocatoria' | 'asistencia' = 'plantilla';
  get formaciones(): string[] {
    if (this.esBaloncesto) {
      return ['2-3', '3-2', '1-3-1', '2-1-2', '1-2-2', '4-1', '1-4'];
    }
    return ['4-4-2', '4-3-3', '3-4-3', '3-5-2', '5-3-2', '4-5-1', '5-4-1', '4-2-3-1', '4-1-4-1'];
  }
  jugadorSeleccionado: any = null;
  
  ofertas: any[] = [];
  equiposTodos: any[] = [];
  cargandoOfertas = false;
  procesandoPago = false;

  get ofertasPendientes(): number {
    return this.ofertas.filter(o => o.estado === 'PENDIENTE').length;
  }

  ngOnInit() {
    if (this.esJugador) {
      this.pestanaActiva = 'convocatoria';
    }

    // Sincroniza el deporte desde el servidor para corregir posibles valores obsoletos en localStorage
    this.http.get<any>(`${environment.apiUrl}/api/ligas/actual`).subscribe({
      next: (liga) => {
        const deporte = liga.deporte as 'FUTBOL' | 'BALONCESTO';
        this.deporteLiga = deporte;
        localStorage.setItem('deporte', deporte);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener deporte de la liga:', err);
        this.deporteLiga = 'FUTBOL';
        this.cdr.detectChanges();
      }
    });

    const userId = this.authService.getUserId();
    if (!userId) { this.cargando = false; return; }

    this.http.get<any>(`${environment.apiUrl}/api/usuarios/${userId}`).subscribe({
      next: (usuario) => {
        if (usuario.teamId) {
          this.cargarEquipo(usuario.teamId);
        } else {
          this.cargando = false;
        }

        if (usuario.jugadorId) {
          this.cargarDatosJugador(usuario.jugadorId);
        }
      },
      error: (err) => {
        console.error('Error al obtener datos del usuario:', err);
        this.cargando = false;
      }
    });
  }

  private cargarDatosJugador(jugadorId: number) {
    this.http.get<any>(`${environment.apiUrl}/api/jugadores/${jugadorId}`).subscribe({
      next: (jugador) => {
        this.miJugador = jugador;
        this.cargarProximoPartido(jugador.equipo?.id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar datos del jugador:', err)
    });
  }

  private cargarProximoPartido(equipoId: number | undefined) {
    if (!equipoId) return;
    this.http.get<any[]>(`${environment.apiUrl}/api/partidos`).subscribe({
      next: (partidos) => {
        const pendientes = partidos.filter(p =>
          p.estado !== 'FINALIZADO_Y_FIRMADO' &&
          (p.local?.id === equipoId || p.visitante?.id === equipoId)
        );
        this.proximoPartido = pendientes.length > 0 ? pendientes[0] : null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar próximo partido:', err)
    });
  }

  toggleConvocatoria(asiste: boolean) {
    if (!this.miJugador) return;
    if (asiste && this.miJugador.estadoDisciplinario === 'SANCIONADO') return;
    this.http.put<any>(`${environment.apiUrl}/api/jugadores/${this.miJugador.id}/convocatoria`, { convocado: asiste }).subscribe({
      next: (jugadorActualizado) => {
        this.miJugador = jugadorActualizado;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al actualizar convocatoria:', err)
    });
  }

  private cargarEquipo(teamId: number) {
    this.http.get<any>(`${environment.apiUrl}/api/equipos/${teamId}`).subscribe({
      next: (equipo) => {
        this.equipo = equipo;
        this.nombreEdicion = equipo.nombre;
        this.escudoEdicion = equipo.escudo ?? '';
        this.cargarJugadores(teamId);
      },
      error: (err) => {
        console.error('Error al cargar equipo:', err);
        this.cargando = false;
      }
    });

    this.http.get<any[]>(`${environment.apiUrl}/api/equipos`).subscribe({
      next: (equipos) => this.equiposTodos = equipos,
      error: (err) => console.error('Error al cargar lista de equipos:', err)
    });
  }

  cargarJugadores(teamId: number) {
    this.http.get<any[]>(`${environment.apiUrl}/api/jugadores/equipo/${teamId}`).subscribe({
      next: (jugadores) => {
        this.jugadores = jugadores;
        this.aplicarOrdenacion();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar jugadores del equipo:', err);
        this.cargando = false;
      }
    });
  }

  ordenar(campo: string) {
    if (this.sortField === campo) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = campo;
      this.sortDirection = 'asc';
    }
    this.aplicarOrdenacion();
  }

  private normalizarPos(pos: string): string {
    if (!pos) return '';
    const map: Record<string, string> = {
      'pívot': 'PIVOT', 'pivot': 'PIVOT',
      'ala-pívot': 'ALA_PIVOT', 'ala-pivot': 'ALA_PIVOT', 'ala_pivot': 'ALA_PIVOT',
      'alero': 'ALERO',
      'base': 'BASE',
      'escolta': 'ESCOLTA',
      'por': 'POR', 'portero': 'POR',
      'def': 'DEF', 'defensa': 'DEF',
      'med': 'MED', 'mediocampista': 'MED', 'centrocampista': 'MED',
      'del': 'DEL', 'delantero': 'DEL',
    };
    return map[pos.toLowerCase()] ?? pos.toUpperCase();
  }

  private aplicarOrdenacion() {
    const posOrder: Record<string, number> = {
      'POR': 1, 'DEF': 2, 'MED': 3, 'DEL': 4,
      'PIVOT': 1, 'ALA_PIVOT': 2, 'ALERO': 2, 'ESCOLTA': 3, 'BASE': 3
    };
    this.jugadores.sort((a, b) => {
      if (this.sortField === 'pos') {
        let valA = posOrder[this.normalizarPos(a.pos)] || 99;
        let valB = posOrder[this.normalizarPos(b.pos)] || 99;
        if (valA !== valB) return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      let valA = a[this.sortField];
      let valB = b[this.sortField];
      if (valA === undefined || valA === null) valA = (typeof valB === 'string') ? '' : 0;
      if (valB === undefined || valB === null) valB = (typeof valA === 'string') ? '' : 0;
      
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  abrirEdicion() { this.editando = true; this.mensajeGuardado = ''; }

  cancelarEdicion() {
    this.editando = false;
    this.nombreEdicion = this.equipo.nombre;
    this.escudoEdicion = this.equipo.escudo ?? '';
  }

  guardarCambios() {
    const body = { ...this.equipo, nombre: this.nombreEdicion, escudo: this.escudoEdicion };
    this.http.put<any>(`${environment.apiUrl}/api/equipos/${this.equipo.id}`, body).subscribe({
      next: (equipoActualizado) => {
        this.equipo = equipoActualizado;
        this.editando = false;
        this.mensajeGuardado = 'Cambios guardados correctamente.';
        setTimeout(() => this.mensajeGuardado = '', 3000);
      },
      error: (err) => console.error('Error al guardar cambios del equipo:', err)
    });
  }

  get jugadoresConfirmados(): any[] {
    return this.jugadores.filter(j => j.convocado === true);
  }

  get jugadoresSinConfirmar(): any[] {
    return this.jugadores.filter(j => !j.convocado);
  }

  cambiarPestana(p: 'plantilla' | 'ofertas' | 'tactica' | 'convocatoria' | 'asistencia') {
    this.pestanaActiva = p;
    this.jugadorSeleccionado = null; 
    if (p === 'ofertas' && this.equipo) {
      this.cargarOfertas(this.equipo.id);
    }
  }

  cargarOfertas(equipoId: number) {
    this.cargandoOfertas = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/ofertas/recibidas/${equipoId}`).subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.cargandoOfertas = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ofertas recibidas:', err);
        this.cargandoOfertas = false;
      }
    });
  }

  getNombreJugador(jugadorId: number): string {
    return this.jugadores.find(j => j.id === jugadorId)?.nombre ?? `Jugador #${jugadorId}`;
  }

  getNombreEquipo(equipoId: number): string {
    return this.equiposTodos.find(e => e.id === equipoId)?.nombre ?? `Equipo #${equipoId}`;
  }

  aceptarOferta(oferta: any) {
    this.http.put<any>(`${environment.apiUrl}/api/ofertas/${oferta.id}/aceptar`, {}).subscribe({
      next: () => {
        if (this.equipo) {
          this.cargarOfertas(this.equipo.id);
          this.cargarJugadores(this.equipo.id);
          this.http.get<any>(`${environment.apiUrl}/api/equipos/${this.equipo.id}`).subscribe({
            next: (eq) => { this.equipo = eq; this.cdr.detectChanges(); },
            error: () => {}
          });
        }
      },
      error: (err) => {
        console.error('Error al aceptar oferta:', err);
        alert(err.error || 'No se pudo aceptar la oferta.');
      }
    });
  }

  rechazarOferta(oferta: any) {
    this.http.put<any>(`${environment.apiUrl}/api/ofertas/${oferta.id}/rechazar`, {}).subscribe({
      next: () => { if (this.equipo) this.cargarOfertas(this.equipo.id); },
      error: (err) => console.error('Error al rechazar oferta:', err)
    });
  }

  pagarCuotaInscripcion() {
    if (!this.equipo || this.procesandoPago) return;
    this.procesandoPago = true;

    this.http.post<{ url: string }>(`${environment.apiUrl}/api/pagos/crear-sesion`, {
      equipoId: this.equipo.id,
      nombreEquipo: this.equipo.nombre,
      precioCentimos: 5000
    }).subscribe({
      next: (resp) => { window.location.href = resp.url; },
      error: (err) => {
        console.error('Error al crear sesión de pago:', err);
        this.procesandoPago = false;
      }
    });
  }

  pagarDeuda() {
    if (!this.equipo) return;
    if (!confirm(`¿Pagar la deuda de ${this.equipo.deudaAcumulada.toLocaleString('es-ES')} €? Se descontará de tu presupuesto.`)) return;
    this.http.put<any>(`${environment.apiUrl}/api/equipos/${this.equipo.id}/pagar-deuda`, {}).subscribe({
      next: (equipoActualizado) => {
        this.equipo = equipoActualizado;
        this.mensajeGuardado = 'Deuda pagada correctamente.';
        setTimeout(() => this.mensajeGuardado = '', 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al pagar la deuda:', err);
        alert(err.error || 'No se pudo pagar la deuda.');
      }
    });
  }

  despedirJugador(jugador: any) {
    if (!confirm(`¿Liberar a ${jugador.nombre}? Pasará a ser Agente Libre en el mercado.`)) return;
    this.http.put<any>(`${environment.apiUrl}/api/jugadores/${jugador.id}/liberar`, {}).subscribe({
      next: () => {
        if (this.equipo) this.cargarJugadores(this.equipo.id);
      },
      error: (err) => console.error('Error al liberar jugador:', err)
    });
  }

  get titulares() {
    return this.jugadores.filter(j => j.titular);
  }

  get suplentes() {
    return this.jugadores.filter(j => !j.titular);
  }

  get maxTitulares(): number {
    return this.esBaloncesto ? 5 : 11;
  }

  get campoLleno(): boolean {
    return this.titulares.length >= this.maxTitulares;
  }

  hacerTitular(j: any) {
    if (this.campoLleno) return;
    j.titular = true;
    this.jugadorSeleccionado = null;
    this.cdr.detectChanges();
  }

  hacerSuplente(j: any) {
    j.titular = false;
    this.jugadorSeleccionado = null;
    this.cdr.detectChanges();
  }

  seleccionarJugador(j: any) {
    if (!this.jugadorSeleccionado) {
      this.jugadorSeleccionado = j;
    } else if (this.jugadorSeleccionado.id === j.id) {
      this.jugadorSeleccionado = null;
    } else {
      const j1 = this.jugadorSeleccionado;
      const j2 = j;

      if (j1.titular && j2.titular) {
        const idx1 = this.jugadores.findIndex(p => p.id === j1.id);
        const idx2 = this.jugadores.findIndex(p => p.id === j2.id);
        const temp = this.jugadores[idx1];
        this.jugadores[idx1] = this.jugadores[idx2];
        this.jugadores[idx2] = temp;
      } else {
        const titular = j1.titular ? j1 : j2;
        const suplente = j1.titular ? j2 : j1;

        titular.titular = false;
        suplente.titular = true;
      }

      this.jugadorSeleccionado = null;
      this.cdr.detectChanges();
    }
  }

  guardarTactica() {
    if (!this.equipo) return;

    const body = {
      titularIds: this.titulares.map(j => j.id),
      formacion: this.equipo.formacion
    };

    this.http.put(`${environment.apiUrl}/api/jugadores/equipo/${this.equipo.id}/titulares`, body).subscribe({
      next: () => {
        this.mensajeGuardado = 'Táctica guardada con éxito.';
        setTimeout(() => this.mensajeGuardado = '', 3000);
      },
      error: (err) => {
        console.error('Error al guardar táctica:', err);
        alert('Error al guardar la táctica.');
      }
    });
  }

  private get formacionActual(): string {
    const formacionDefault = this.esBaloncesto ? '2-1-2' : '4-4-2';
    const guardada = this.equipo?.formacion;
    return (guardada && this.formaciones.includes(guardada)) ? guardada : formacionDefault;
  }

  getSlots(formacionStr: string) {
    if (!formacionStr) return [];
    const parts = formacionStr.split('-').map(Number);
    const slots: any[] = [];

    if (this.esBaloncesto) {
      // Baloncesto: jugadores dentro del área de triple (bottom 7% → 49%)
      const yRange = 42;
      const yBase = 7;
      const yStep = parts.length > 1 ? yRange / (parts.length - 1) : 0;

      parts.forEach((count, lineIdx) => {
        let type = 'ALERO';
        if (lineIdx === 0) type = 'PIVOT';
        else if (lineIdx === parts.length - 1) type = 'BASE';

        const y = yBase + (lineIdx * yStep);
        const xStep = count > 1 ? 70 / (count - 1) : 0;
        for (let i = 0; i < count; i++) {
          const x = count > 1 ? 15 + (i * xStep) : 50;
          slots.push({ type, x, y });
        }
      });
    } else {
      slots.push({ type: 'POR', x: 50, y: 7 });

      const yRange = 63;
      const yBase = 25;
      const yStep = parts.length > 1 ? yRange / (parts.length - 1) : 0;

      parts.forEach((count, lineIdx) => {
        let type = 'MED';
        if (lineIdx === 0) type = 'DEF';
        else if (lineIdx === parts.length - 1) type = 'DEL';

        const y = yBase + (lineIdx * yStep);
        const xStep = count > 1 ? 70 / (count - 1) : 0;
        for (let i = 0; i < count; i++) {
          const x = count > 1 ? 15 + (i * xStep) : 50;
          slots.push({ type, x, y });
        }
      });
    }

    return slots;
  }

  estaFueraDePosicion(jugador: any, index: number): boolean {
    if (!this.equipo) return false;
    const slots = this.getSlots(this.formacionActual);
    const slot = slots[index];
    if (!slot) return false;

    const pos = this.normalizarPos(jugador.pos);

    if (this.esBaloncesto) {
      if (slot.type === 'PIVOT') return pos !== 'PIVOT' && pos !== 'ALA_PIVOT';
      if (slot.type === 'ALERO') return pos !== 'ALERO' && pos !== 'ALA_PIVOT';
      if (slot.type === 'BASE')  return pos !== 'BASE'  && pos !== 'ESCOLTA';
      return false;
    }

    if (slot.type === 'POR') return pos !== 'POR';
    return pos !== slot.type;
  }

  getPosicionEstilo(jugador: any, index: number) {
    if (!this.equipo) return {};
    const slots = this.getSlots(this.formacionActual);
    const slot = slots[index];

    if (!slot) return { display: 'none' };

    return { 
      bottom: `${slot.y}%`, 
      left: `${slot.x}%`,
      transform: 'translateX(-50%)'
    };
  }
}
