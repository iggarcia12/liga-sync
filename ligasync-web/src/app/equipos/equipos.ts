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

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  get esAdmin(): boolean { return this.authService.isAdmin(); }

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

    this.jugadoresFiltrados = this.jugadores.filter(j => j.equipo && j.equipo.id == this.equipoActualSeleccionado);
    
    // Distribuimos para la pizarra
    this.porteros = this.jugadoresFiltrados.filter(j => j.pos === 'POR');
    this.defensas = this.jugadoresFiltrados.filter(j => j.pos === 'DEF');
    this.medios = this.jugadoresFiltrados.filter(j => j.pos === 'MED');
    this.delanteros = this.jugadoresFiltrados.filter(j => j.pos === 'DEL');
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

  eliminarEquipo(id: number) {
    const confirmacion = window.confirm("⚠️ ¿Estás seguro de que quieres borrar este equipo permanentemente?");
    if (confirmacion) {
      this.http.delete('http://localhost:8080/api/equipos/' + id).subscribe(() => {
        this.cargarDatosGenerales(); 
      });
    }
  }
}