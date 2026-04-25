import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mercado.html',
  styleUrl: './mercado.css'
})
export class MercadoComponent implements OnInit {
  cargando = true;
  agentesLibres: any[] = [];
  jugadoresConEquipo: any[] = [];
  equipos: any[] = [];
  jornadaActual = 0;

  mostrarModalFichaje = false;
  nuevoJugador: any = { nombre: '', pos: 'DEL', media: 70, valor: 5000000, equipo: null };

  mostrarModalOferta = false;
  jugadorParaOfertar: any = null;
  montoOferta = 0;

  posicionesFutbol = ['POR', 'DEF', 'MED', 'DEL'];
  posicionesBasket = ['BASE', 'ESCOLTA', 'ALERO', 'ALA-PÍVOT', 'PÍVOT'];

  get posicionesDisponibles(): string[] {
    return this.authService.esBaloncesto() ? this.posicionesBasket : this.posicionesFutbol;
  }

  get ventanaAbierta(): boolean {
    return this.jornadaActual === 0 || this.jornadaActual % 3 === 0;
  }

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  get esAdmin(): boolean { return this.authService.isAdmin(); }
  get esEntrenador(): boolean { return this.authService.isEntrenador(); }

  get miEquipoNombre(): string {
    return this.equipos.find(e => e.id === this.miEquipoId)?.nombre ?? '';
  }

  ngOnInit() {
    this.cargarMercado();
    this.http.get<number>('http://localhost:8080/api/partidos/jornada-actual').subscribe({
      next: (j) => { this.jornadaActual = j; this.cdr.detectChanges(); },
      error: (err) => console.error('Error al cargar jornada actual:', err)
    });
  }

  cargarMercado() {
    this.cargando = true;
    const urlBase = 'http://localhost:8080/api';

    forkJoin({
      jugadoresReq: this.http.get<any[]>(urlBase + '/jugadores').pipe(catchError(() => of([]))),
      equiposReq:   this.http.get<any[]>(urlBase + '/equipos').pipe(catchError(() => of([])))
    }).subscribe(resp => {
      let todos = resp.jugadoresReq;
      if ((todos as any)?._embedded) todos = (todos as any)._embedded.jugadores || [];

      let eqs = resp.equiposReq;
      if ((eqs as any)?._embedded) eqs = (eqs as any)._embedded.equipos || [];

      this.equipos = eqs;
      this.agentesLibres = todos.filter((j: any) => !j.equipo?.id);
      this._todosConEquipo = todos.filter((j: any) => j.equipo?.id);
      this.actualizarJugadoresConEquipo();

      this.cargando = false;

      if (this.authService.isEntrenador()) {
        const userId = this.authService.getUserId();
        if (userId) {
          this.http.get<any>(`${urlBase}/usuarios/${userId}`).subscribe({
            next: (u) => {
              this.miEquipoId = u.teamId ?? null;
              this.actualizarJugadoresConEquipo();
              this.cdr.detectChanges();
            },
            error: (err) => console.error('Error al cargar equipo del entrenador:', err)
          });
        }
      }

      this.cdr.detectChanges();
    });
  }

  private _todosConEquipo: any[] = [];

  private actualizarJugadoresConEquipo() {
    this.jugadoresConEquipo = this._todosConEquipo.filter(
      (j: any) => j.equipo?.id !== this._miEquipoId
    );
  }

  _miEquipoId: number | null = null;
  miEquipoPresupuesto = 0;

  get miEquipoId(): number | null { return this._miEquipoId; }

  set miEquipoId(val: number | null) {
    this._miEquipoId = val;
    if (val) this.cargarPresupuesto(val);
    else this.miEquipoPresupuesto = 0;
    this.actualizarJugadoresConEquipo();
  }

  cargarPresupuesto(teamId: number) {
    this.http.get<any>(`http://localhost:8080/api/equipos/${teamId}`).subscribe({
      next: (eq) => { this.miEquipoPresupuesto = eq.presupuesto || 0; this.cdr.detectChanges(); },
      error: (err) => console.error('Error al cargar presupuesto:', err)
    });
  }

  abrirModal() {
    this.mostrarModalFichaje = true;
    this.nuevoJugador = { nombre: '', pos: this.posicionesDisponibles[0], media: 70, valor: 5000000, equipo: null };
  }

  cerrarModal() { this.mostrarModalFichaje = false; }

  crearJugadorNuevo() {
    const jugadorAEnviar = { ...this.nuevoJugador };
    if (jugadorAEnviar.equipo && jugadorAEnviar.equipo !== 'null') {
      jugadorAEnviar.equipo = this.equipos.find(e => e.id == jugadorAEnviar.equipo) || null;
    } else {
      jugadorAEnviar.equipo = null;
    }

    this.http.post<any>('http://localhost:8080/api/jugadores', jugadorAEnviar).subscribe({
      next: () => {
        alert('¡Jugador registrado con éxito!');
        this.cerrarModal();
        this.cargarMercado();
        if (this.miEquipoId) this.cargarPresupuesto(this.miEquipoId);
      },
      error: (err) => {
        const errorMsg = typeof err.error === 'string' ? err.error : (err.message || 'Error desconocido');
        alert('Error al registrar el jugador: ' + errorMsg);
        console.error(err);
      }
    });
  }

  ficharAgenteLibre(jugador: any) {
    if (!this.miEquipoId) {
      alert('Necesitas tener un equipo asignado para realizar fichajes.');
      return;
    }
    const equipoDestino = this.equipos.find(e => e.id == this.miEquipoId);
    if (!confirm(`¿Fichar a ${jugador.nombre} para ${equipoDestino?.nombre}?`)) return;

    // Fichaje directo para agentes libres (sin negociación entre clubes)
    const payload = { ...jugador, equipo: equipoDestino };
    this.http.put(`http://localhost:8080/api/jugadores/${jugador.id}`, payload, { responseType: 'text' as 'json' }).subscribe({
      next: () => {
        this.cargarMercado();
        if (this.miEquipoId) this.cargarPresupuesto(this.miEquipoId);
        alert(`¡Fichaje completado! ${jugador.nombre} es tuyo.`);
      },
      error: (err) => {
        if (err.status === 400) alert('Presupuesto insuficiente: ' + err.error);
        else if (err.status === 403) alert('Sin permiso para realizar esta acción.');
        else console.error('Error en el traspaso:', err);
      }
    });
  }

  abrirModalOferta(jugador: any) {
    this.jugadorParaOfertar = jugador;
    this.montoOferta = jugador.valor || 0;
    this.mostrarModalOferta = true;
  }

  cerrarModalOferta() {
    this.mostrarModalOferta = false;
    this.jugadorParaOfertar = null;
    this.montoOferta = 0;
  }

  enviarOferta() {
    if (!this.miEquipoId || !this.jugadorParaOfertar) return;

    // Flujo de negociación: las ofertas deben ser validadas por el equipo receptor
    const payload = {
      equipoOrigenId:  this.miEquipoId,
      equipoDestinoId: this.jugadorParaOfertar.equipo.id,
      jugadorId:       this.jugadorParaOfertar.id,
      monto:           this.montoOferta
    };

    this.http.post<any>('http://localhost:8080/api/ofertas', payload).subscribe({
      next: () => {
        alert(`Oferta enviada por ${this.jugadorParaOfertar.nombre}. El entrenador rival deberá aceptarla.`);
        this.cerrarModalOferta();
      },
      error: (err) => {
        const msg = err.error || 'No se pudo enviar la oferta.';
        alert(`Error: ${msg}`);
        console.error('Error al enviar oferta:', err);
      }
    });
  }
}
