import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipos.html',
  styleUrl: './equipos.css'
})
export class EquiposComponent implements OnInit {
  equipos: any[] = [];
  jugadores: any[] = [];
  cargando: boolean = true;
  
  // Selección actual
  equipoActualSeleccionado: number | null = null;
  equipoActualDetalles: any = null;
  
  // Jugadores del equipo divididos para la pizarra
  jugadoresFiltrados: any[] = [];
  porteros: any[] = [];
  defensas: any[] = [];
  medios: any[] = [];
  delanteros: any[] = [];

  // Variables para CRUD de Equipo (Mantenemos la lógica orginal)
  mostrarFormulario: boolean = false;
  modoEdicion: boolean = false;
  equipoSeleccionadoId: number | null = null;
  nuevoEquipo: any = { nombre: '', ciudad: '' };

  // Modal inyectar presupuesto
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
    const urlBase = 'http://localhost:8080/api'; 
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
        // En Spring Data REST las listas suelen venir en _embedded. 
        // Por si acaso, admitimos ambos formatos:
        this.equipos = resp.equiposReq;
        this.jugadores = resp.jugadoresReq;

        // Validamos por si viene mapeado como _embedded
        if (resp.equiposReq && (resp.equiposReq as any)._embedded) {
           this.equipos = (resp.equiposReq as any)._embedded.equipos || [];
        }
        if (resp.jugadoresReq && (resp.jugadoresReq as any)._embedded) {
           this.jugadores = (resp.jugadoresReq as any)._embedded.jugadores || [];
        }

        // Si hay equipos, autoseleccionar el primero
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

  procesarJugadoresDelEquipoActivo() {
    if (!this.equipoActualSeleccionado || this.jugadores.length === 0) return;

    const todosLosDelEquipo = this.jugadores.filter(j => j.equipo && j.equipo.id == this.equipoActualSeleccionado);
    
    // Titulares reales según el backend
    this.jugadoresFiltrados = todosLosDelEquipo.sort((a, b) => {
      // Orden de posiciones: POR -> DEF -> MED -> DEL
      const posOrder: Record<string, number> = { 'POR': 1, 'DEF': 2, 'MED': 3, 'DEL': 4 };
      const orderA = posOrder[a.pos] || 99;
      const orderB = posOrder[b.pos] || 99;
      if (orderA !== orderB) return orderA - orderB;
      
      // Dentro de la misma posición, titulares primero
      if (a.titular && !b.titular) return -1;
      if (!a.titular && b.titular) return 1;

      return (b.media || 0) - (a.media || 0);
    });
  }

  get titulares() {
    const reales = this.jugadoresFiltrados.filter(j => j.titular);
    
    // Si hay titulares reales, los usamos (ordenados por posición para los slots)
    if (reales.length > 0) {
      return reales.sort((a, b) => {
        const posOrder: Record<string, number> = { 'POR': 1, 'DEF': 2, 'MED': 3, 'DEL': 4 };
        return (posOrder[a.pos] || 99) - (posOrder[b.pos] || 99);
      });
    }

    // Si NO hay titulares (equipos sin configurar), generamos un "11 Ideal" automático
    const ideal: any[] = [];
    const por = this.jugadoresFiltrados.filter(j => j.pos === 'POR').sort((a,b) => (b.media||0)-(a.media||0)).slice(0, 1);
    const def = this.jugadoresFiltrados.filter(j => j.pos === 'DEF').sort((a,b) => (b.media||0)-(a.media||0)).slice(0, 4);
    const med = this.jugadoresFiltrados.filter(j => j.pos === 'MED').sort((a,b) => (b.media||0)-(a.media||0)).slice(0, 4);
    const del = this.jugadoresFiltrados.filter(j => j.pos === 'DEL').sort((a,b) => (b.media||0)-(a.media||0)).slice(0, 2);
    
    return [...por, ...def, ...med, ...del];
  }

  getSlots(formacionStr: string) {
    if (!formacionStr) return [];
    const parts = formacionStr.split('-').map(Number);
    const slots: any[] = [];

    if (this.esBaloncesto) {
      const yRange = 70;
      const yBase = 15;
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

    const titulares = this.titulares;
    let formacionNatural: string;

    if (this.esBaloncesto) {
      const nGuards = titulares.filter(j => j.pos === 'BASE' || j.pos === 'ESCOLTA').length;
      const nWings  = titulares.filter(j => j.pos === 'ALERO').length;
      const nBigs   = titulares.filter(j => j.pos === 'ALA-PÍVOT' || j.pos === 'PÍVOT').length;
      formacionNatural = (nGuards || nWings || nBigs) ? `${nGuards}-${nWings}-${nBigs}` : '2-1-2';
    } else {
      const nDef = titulares.filter(j => j.pos === 'DEF').length;
      const nMed = titulares.filter(j => j.pos === 'MED').length;
      const nDel = titulares.filter(j => j.pos === 'DEL').length;
      formacionNatural = (nDef || nMed || nDel) ? `${nDef}-${nMed}-${nDel}` : '4-4-2';
    }

    const slots = this.getSlots(formacionNatural);
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
      console.log('Se simularía la venta enviando el jugador a Mercado (equipoId=null)');
      // Simulación Frontend
      jugador.equipo = null;
      this.procesarJugadoresDelEquipoActivo();
    }
  }

  // --- CRUD DE EQUIPOS ---
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
    const urlBase = 'http://localhost:8080/api/equipos'; 
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
      `http://localhost:8080/api/equipos/${this.equipoActualSeleccionado}/presupuesto`,
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
      this.http.delete('http://localhost:8080/api/equipos/' + id).subscribe(() => {
        this.cargarDatosGenerales(); 
      });
    }
  }
}