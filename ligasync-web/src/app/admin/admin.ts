import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {

  readonly urlBase = 'http://localhost:8080/api';
  tabActiva: string = 'usuarios';
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
  }

  activarTab(tab: string) {
    this.tabActiva = tab;
    this.cdr.detectChanges();
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

  getRolClass(rol: string): string {
    if (!rol) return 'badge-user';
    const r = rol.toUpperCase();
    if (r === 'ADMIN') return 'badge-admin';
    if (r === 'BANNED') return 'badge-banned';
    return 'badge-user';
  }

  getInitial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }
}
