import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './equipos.html',
  styleUrl: './equipos.css'
})
export class EquiposComponent implements OnInit {
  equipos: any[] = [];
  jugadores: any[] = [];
  cargando: boolean = true;
  
  equipoActualSeleccionado: number | null = null;
  equipoActualDetalles: any = null;
  jugadoresFiltrados: any[] = [];
  porteros: any[] = [];
  defensas: any[] = [];
  medios: any[] = [];
  delanteros: any[] = [];

  mostrarFormulario: boolean = false;
  modoEdicion: boolean = false;
  equipoSeleccionadoId: number | null = null;
  nuevoEquipo: any = { nombre: '', ciudad: '' };

  mostrarModalPresupuesto: boolean = false;
  montoInyectar: number = 0;


  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  get esAdmin(): boolean { return this.authService.isAdmin(); }
  get esBaloncesto(): boolean { return this.authService.esBaloncesto(); }

  ngOnInit() {
    this.cargarDatosGenerales();
  }

  cargarDatosGenerales() {
    const urlBase = environment.apiUrl + '/api';
    this.cargando = true;

    forkJoin({
      equiposReq: this.http.get<any[]>(urlBase + '/equipos').pipe(
        catchError(err => { console.error("Error Equipos:", err); return of([]); })
      ),
      jugadoresReq: this.http.get<any[]>(urlBase + '/jugadores').pipe(
        catchError(err => { console.error("Error Jugadores:", err); return of([]); })
      )
    }).subscribe({
      next: (resp) => {
        this.equipos = resp.equiposReq;
        this.jugadores = resp.jugadoresReq;

        if (resp.equiposReq && (resp.equiposReq as any)._embedded) {
           this.equipos = (resp.equiposReq as any)._embedded.equipos || [];
        }
        if (resp.jugadoresReq && (resp.jugadoresReq as any)._embedded) {
           this.jugadores = (resp.jugadoresReq as any)._embedded.jugadores || [];
        }

        if (this.equipos.length > 0 && !this.equipoActualSeleccionado) {
           this.onEquipoChange(this.equipos[0].id);
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar datos simultáneos", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  onEquipoChange(id: number) {
    this.equipoActualSeleccionado = id;
    this.equipoActualDetalles = this.equipos.find(e => e.id == id);
    this.procesarJugadoresDelEquipoActivo();
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

  private posOrder: Record<string, number> = {
    'POR': 1, 'DEF': 2, 'MED': 3, 'DEL': 4,
    'PIVOT': 1, 'ALA_PIVOT': 2, 'ALERO': 2, 'ESCOLTA': 3, 'BASE': 3
  };

  procesarJugadoresDelEquipoActivo() {
    if (!this.equipoActualSeleccionado || this.jugadores.length === 0) return;

    const todosLosDelEquipo = this.jugadores.filter(j => j.equipo && j.equipo.id == this.equipoActualSeleccionado);

    this.jugadoresFiltrados = todosLosDelEquipo.sort((a, b) => {
      const orderA = this.posOrder[this.normalizarPos(a.pos)] || 99;
      const orderB = this.posOrder[this.normalizarPos(b.pos)] || 99;
      if (orderA !== orderB) return orderA - orderB;
      if (a.titular && !b.titular) return -1;
      if (!a.titular && b.titular) return 1;
      return (b.media || 0) - (a.media || 0);
    });
  }

  get titulares() {
    const reales = this.jugadoresFiltrados.filter(j => j.titular);

    if (reales.length > 0) {
      return reales.sort((a, b) =>
        (this.posOrder[this.normalizarPos(a.pos)] || 99) - (this.posOrder[this.normalizarPos(b.pos)] || 99)
      );
    }

    const por = this.jugadoresFiltrados.filter(j => this.normalizarPos(j.pos) === 'POR').sort((a,b) => (b.media||0)-(a.media||0)).slice(0, 1);
    const def = this.jugadoresFiltrados.filter(j => this.normalizarPos(j.pos) === 'DEF').sort((a,b) => (b.media||0)-(a.media||0)).slice(0, 4);
    const med = this.jugadoresFiltrados.filter(j => this.normalizarPos(j.pos) === 'MED').sort((a,b) => (b.media||0)-(a.media||0)).slice(0, 4);
    const del = this.jugadoresFiltrados.filter(j => this.normalizarPos(j.pos) === 'DEL').sort((a,b) => (b.media||0)-(a.media||0)).slice(0, 2);

    return [...por, ...def, ...med, ...del];
  }

  getSlots(formacionStr: string) {
    if (!formacionStr) return [];
    const parts = formacionStr.split('-').map(Number);
    const slots: any[] = [];

    if (this.esBaloncesto) {
      const yRange = 42;
      const yBase = 7;
      const yStep = parts.length > 1 ? yRange / (parts.length - 1) : 0;
      parts.forEach((count, lineIdx) => {
        const y = yBase + (lineIdx * yStep);
        const xStep = count > 1 ? 70 / (count - 1) : 0;
        for (let i = 0; i < count; i++) {
          const x = count > 1 ? 15 + (i * xStep) : 50;
          slots.push({ type: 'BASKET', x, y });
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
    return false;
  }

  getPosicionEstilo(jugador: any, index: number) {
    if (!this.equipoActualDetalles) return {};

    const formacionDefault = this.esBaloncesto ? '2-1-2' : '4-4-2';
    const formacion = this.equipoActualDetalles.formacion || formacionDefault;
    const slots = this.getSlots(formacion);
    const slot = slots[index];
    if (!slot) return { display: 'none' };

    return {
      bottom: `${slot.y}%`,
      left: `${slot.x}%`,
      transform: 'translateX(-50%)'
    };
  }

  venderJugador(jugador: any) {
    const confirm = window.confirm(`¿Seguro que quieres vender a ${jugador.nombre}?`);
    if(confirm) {
      jugador.equipo = null;
      this.procesarJugadoresDelEquipoActivo();
    }
  }

  abrirFormulario(equipoExistente?: any) {
    this.mostrarFormulario = true;
    if (equipoExistente) {
      this.modoEdicion = true;
      this.equipoSeleccionadoId = equipoExistente.id; 
      this.nuevoEquipo = { nombre: equipoExistente.nombre, ciudad: equipoExistente.ciudad };
    } else {
      this.modoEdicion = false;
      this.equipoSeleccionadoId = null;
      this.nuevoEquipo = { nombre: '', ciudad: '' };
    }
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.nuevoEquipo = { nombre: '', ciudad: '' };
  }

  guardarEquipo() {
    const urlBase = environment.apiUrl + '/api/equipos';
    if (this.modoEdicion) {
      this.http.put<any>(urlBase + '/' + this.equipoSeleccionadoId, this.nuevoEquipo).subscribe(() => {
        this.cancelarFormulario();
        this.cargarDatosGenerales(); 
      });
    } else {
      this.http.post<any>(urlBase, this.nuevoEquipo).subscribe(() => {
        this.cancelarFormulario();
        this.cargarDatosGenerales();
      });
    }
  }

  abrirModalPresupuesto() {
    this.montoInyectar = 0;
    this.mostrarModalPresupuesto = true;
  }

  cerrarModalPresupuesto() {
    this.mostrarModalPresupuesto = false;
  }

  inyectarPresupuesto() {
    if (!this.equipoActualSeleccionado || this.montoInyectar === 0) return;
    this.http.patch<any>(
      `${environment.apiUrl}/api/equipos/${this.equipoActualSeleccionado}/presupuesto`,
      { monto: this.montoInyectar }
    ).subscribe({
      next: (equipoActualizado) => {
        const idx = this.equipos.findIndex(e => e.id === equipoActualizado.id);
        if (idx !== -1) this.equipos[idx] = equipoActualizado;
        this.equipoActualDetalles = equipoActualizado;
        this.cerrarModalPresupuesto();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al ajustar presupuesto:', err)
    });
  }

  eliminarEquipo(id: number) {
    const confirmacion = window.confirm("⚠️ ¿Estás seguro de que quieres borrar este equipo permanentemente?");
    if (confirmacion) {
      this.http.delete(`${environment.apiUrl}/api/equipos/` + id).subscribe(() => {
        this.cargarDatosGenerales(); 
      });
    }
  }
}