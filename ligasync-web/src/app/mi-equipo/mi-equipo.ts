import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // --- Ordenación de la tabla
  sortField: string = 'pos';
  sortDirection: 'asc' | 'desc' = 'asc';

  nombreEdicion = '';
  escudoEdicion = '';

  // --- FASE 2: Pestañas, Ofertas y Despidos
  // --- FASE 3: Pizarra Táctica
  pestanaActiva: 'plantilla' | 'ofertas' | 'tactica' = 'plantilla';
  formaciones = ['4-4-2', '4-3-3', '3-4-3', '3-5-2', '5-3-2', '4-5-1', '5-4-1', '4-2-3-1', '4-1-4-1'];
  jugadorSeleccionado: any = null;
  
  ofertas: any[] = [];
  equiposTodos: any[] = [];
  cargandoOfertas = false;

  get ofertasPendientes(): number {
    return this.ofertas.filter(o => o.estado === 'PENDIENTE').length;
  }

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (!userId) { this.cargando = false; return; }

    this.http.get<any>(`http://localhost:8080/api/usuarios/${userId}`).subscribe({
      next: (usuario) => {
        if (usuario.teamId) {
          this.cargarEquipo(usuario.teamId);
        } else {
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error al obtener datos del entrenador:', err);
        this.cargando = false;
      }
    });
  }

  private cargarEquipo(teamId: number) {
    this.http.get<any>(`http://localhost:8080/api/equipos/${teamId}`).subscribe({
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

    // Cargar todos los equipos para resolver nombres en las ofertas
    this.http.get<any[]>('http://localhost:8080/api/equipos').subscribe({
      next: (equipos) => this.equiposTodos = equipos,
      error: (err) => console.error('Error al cargar lista de equipos:', err)
    });
  }

  cargarJugadores(teamId: number) {
    this.http.get<any[]>(`http://localhost:8080/api/jugadores/equipo/${teamId}`).subscribe({
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

  private aplicarOrdenacion() {
    const posOrder: Record<string, number> = { 'POR': 1, 'DEF': 2, 'MED': 3, 'DEL': 4 };
    this.jugadores.sort((a, b) => {
      // Si estamos en la pestaña de táctica, el orden base DEBE ser por posición para encajar en los slots
      // Pero solo si no estamos en medio de un proceso de ordenación por otro campo
      if (this.sortField === 'pos') {
        let valA = posOrder[a.pos] || 99;
        let valB = posOrder[b.pos] || 99;
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
    this.http.put<any>(`http://localhost:8080/api/equipos/${this.equipo.id}`, body).subscribe({
      next: (equipoActualizado) => {
        this.equipo = equipoActualizado;
        this.editando = false;
        this.mensajeGuardado = 'Cambios guardados correctamente.';
        setTimeout(() => this.mensajeGuardado = '', 3000);
      },
      error: (err) => console.error('Error al guardar cambios del equipo:', err)
    });
  }

  // --- FASE 2 y 3: Gestión de pestañas
  cambiarPestana(p: 'plantilla' | 'ofertas' | 'tactica') {
    this.pestanaActiva = p;
    this.jugadorSeleccionado = null; // Limpiar selección al cambiar de pestaña
    if (p === 'ofertas' && this.equipo) {
      this.cargarOfertas(this.equipo.id);
    }
  }

  // --- FASE 2: Ofertas recibidas
  cargarOfertas(equipoId: number) {
    this.cargandoOfertas = true;
    this.http.get<any[]>(`http://localhost:8080/api/ofertas/recibidas/${equipoId}`).subscribe({
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
    this.http.put<any>(`http://localhost:8080/api/ofertas/${oferta.id}/aceptar`, {}).subscribe({
      next: () => {
        if (this.equipo) {
          this.cargarOfertas(this.equipo.id);
          this.cargarJugadores(this.equipo.id);
          // Refrescar presupuesto del equipo
          this.http.get<any>(`http://localhost:8080/api/equipos/${this.equipo.id}`).subscribe({
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
    this.http.put<any>(`http://localhost:8080/api/ofertas/${oferta.id}/rechazar`, {}).subscribe({
      next: () => { if (this.equipo) this.cargarOfertas(this.equipo.id); },
      error: (err) => console.error('Error al rechazar oferta:', err)
    });
  }

  // --- FASE 2: Despidos
  despedirJugador(jugador: any) {
    if (!confirm(`¿Liberar a ${jugador.nombre}? Pasará a ser Agente Libre en el mercado.`)) return;
    this.http.put<any>(`http://localhost:8080/api/jugadores/${jugador.id}/liberar`, {}).subscribe({
      next: () => {
        if (this.equipo) this.cargarJugadores(this.equipo.id);
      },
      error: (err) => console.error('Error al liberar jugador:', err)
    });
  }

  // --- FASE 3: Pizarra Táctica Logic
  get titulares() {
    return this.jugadores.filter(j => j.titular);
  }

  get suplentes() {
    return this.jugadores.filter(j => !j.titular);
  }

  seleccionarJugador(j: any) {
    if (!this.jugadorSeleccionado) {
      this.jugadorSeleccionado = j;
    } else if (this.jugadorSeleccionado.id === j.id) {
      this.jugadorSeleccionado = null;
    } else {
      // Intercambio
      const j1 = this.jugadorSeleccionado;
      const j2 = j;

      if (j1.titular && j2.titular) {
        // Intercambio de posiciones visuales (en este MVP simplemente permutamos en el array si fuera necesario, 
        // pero como se posicionan por 'pos', no hay mucho que "intercambiar" visualmente salvo que guardemos el orden)
        // Para que el usuario vea un cambio real, podríamos intercambiar sus 'ids' en un array de "on-field positions"
        // Pero el requerimiento dice "según su posición (POR, DEF, MED, DEL)".
        // Si ambos son DEF, simplemente se "notará" si cambiamos su orden en la lista de titulares.
        const idx1 = this.jugadores.findIndex(p => p.id === j1.id);
        const idx2 = this.jugadores.findIndex(p => p.id === j2.id);
        const temp = this.jugadores[idx1];
        this.jugadores[idx1] = this.jugadores[idx2];
        this.jugadores[idx2] = temp;
      } else {
        // Intercambio Titular <-> Suplente
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

    this.http.put(`http://localhost:8080/api/jugadores/equipo/${this.equipo.id}/titulares`, body).subscribe({
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

  // --- FASE 3: Lógica de Slots Fijos
  getSlots(formacionStr: string) {
    if (!formacionStr) return [];
    const parts = formacionStr.split('-').map(Number);
    const slots: any[] = [];
    
    // Portero (siempre slot 0)
    slots.push({ type: 'POR', x: 50, y: 7 });

    const yRange = 63;
    const yBase = 25;
    const yStep = parts.length > 1 ? yRange / (parts.length - 1) : 0;

    parts.forEach((count, lineIdx) => {
      // Determinamos el tipo de posición según la línea
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

    return slots;
  }

  estaFueraDePosicion(jugador: any, index: number): boolean {
    if (!this.equipo) return false;
    const formacion = this.equipo.formacion || '4-4-2';
    const slots = this.getSlots(formacion);
    const slot = slots[index];
    if (!slot) return false;

    // POR solo puede ir en slot POR
    if (slot.type === 'POR') return jugador.pos !== 'POR';
    // Si el slot es DEF/MED/DEL, el jugador debe coincidir
    return jugador.pos !== slot.type;
  }

  // Helper para posicionar jugadores en el campo
  getPosicionEstilo(jugador: any, index: number) {
    if (!this.equipo) return {};
    const formacion = this.equipo.formacion || '4-4-2';
    const slots = this.getSlots(formacion);
    const slot = slots[index];

    if (!slot) {
      // Si hay más de 11, los amontonamos fuera o los ocultamos
      return { display: 'none' };
    }

    return { 
      bottom: `${slot.y}%`, 
      left: `${slot.x}%`,
      transform: 'translateX(-50%)'
    };
  }
}
