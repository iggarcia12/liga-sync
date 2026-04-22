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

  // Ordenación de la tabla
  sortField: string = 'pos'; // Por defecto posición
  sortDirection: 'asc' | 'desc' = 'asc';

  nombreEdicion = '';
  escudoEdicion = '';

  ngOnInit() {
    const userId = this.authService.getUserId();
    console.log('[MiEquipo] userId:', userId);
    if (!userId) {
      this.cargando = false;
      return;
    }

    this.http.get<any>(`http://localhost:8080/api/usuarios/${userId}`).subscribe({
      next: (usuario) => {
        console.log('[MiEquipo] usuario recibido:', usuario);
        if (usuario.teamId) {
          this.cargarEquipo(usuario.teamId);
        } else {
          console.log('[MiEquipo] usuario sin teamId, mostrando estado vacío');
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
    console.log('[MiEquipo] cargando equipo con id:', teamId);
    this.http.get<any>(`http://localhost:8080/api/equipos/${teamId}`).subscribe({
      next: (equipo) => {
        console.log('[MiEquipo] equipo recibido:', equipo);
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
  }

  private cargarJugadores(teamId: number) {
    console.log('[MiEquipo] cargando jugadores del equipo:', teamId);
    this.http.get<any[]>(`http://localhost:8080/api/jugadores/equipo/${teamId}`).subscribe({
      next: (jugadores) => {
        console.log('[MiEquipo] jugadores recibidos:', jugadores);
        this.jugadores = jugadores;
        this.aplicarOrdenacion(); // Ordenar al cargar
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
      let valA = a[this.sortField];
      let valB = b[this.sortField];

      // Manejo de nulos
      if (valA === undefined || valA === null) valA = (typeof valB === 'string') ? '' : 0;
      if (valB === undefined || valB === null) valB = (typeof valA === 'string') ? '' : 0;

      // Lógica especial para posición
      if (this.sortField === 'pos') {
        valA = posOrder[valA] || 99;
        valB = posOrder[valB] || 99;
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  abrirEdicion() {
    this.editando = true;
    this.mensajeGuardado = '';
  }

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
}
