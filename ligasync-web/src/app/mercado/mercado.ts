import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mercado.html',
  styleUrl: './mercado.css'
})
export class MercadoComponent implements OnInit {
  cargando: boolean = true;
  agentesLibres: any[] = [];
  equipos: any[] = []; // Para poder asignarlos directamente si queremos

  // Formulario
  mostrarModalFichaje: boolean = false;
  nuevoJugador: any = { nombre: '', pos: 'DEL', media: 70, equipo: null };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarMercado();
  }

  cargarMercado() {
    this.cargando = true;
    const urlBase = 'http://localhost:8080/api';

    forkJoin({
      jugadoresReq: this.http.get<any[]>(urlBase + '/jugadores').pipe(
        catchError(err => of([]))
      ),
      equiposReq: this.http.get<any[]>(urlBase + '/equipos').pipe(
        catchError(err => of([]))
      )
    }).subscribe(resp => {
      let jResult = resp.jugadoresReq;
      if (jResult && (jResult as any)._embedded) jResult = (jResult as any)._embedded.jugadores || [];
      
      let eResult = resp.equiposReq;
      if (eResult && (eResult as any)._embedded) eResult = (eResult as any)._embedded.equipos || [];

      this.equipos = eResult;

      // Un Agente Libre es aquel que no tiene un equipo asignado o su llave de equipo está vacía
      this.agentesLibres = jResult.filter((j: any) => !j.equipo || !j.equipo.id);
      
      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  // --- CRUD Lógica de "Cantera" (Crear Jugador desde 0) ---
  abrirModal() {
    this.mostrarModalFichaje = true;
    this.nuevoJugador = { nombre: '', pos: 'DEL', media: 70, precio: 5000000, equipo: null };
  }

  cerrarModal() {
    this.mostrarModalFichaje = false;
  }

  crearJugadorNuevo() {
    const url = 'http://localhost:8080/api/jugadores';

    // Formateamos correctamente la relación con equipo si seleccionó uno
    const jugadorAEnviar = { ...this.nuevoJugador };
    if (jugadorAEnviar.equipo && jugadorAEnviar.equipo !== 'null') {
      const eqEncontrado = this.equipos.find(e => e.id == jugadorAEnviar.equipo);
      jugadorAEnviar.equipo = eqEncontrado || null; // Objeto entero o ID dependiendo del Backend
    } else {
      jugadorAEnviar.equipo = null;
    }

    this.http.post<any>(url, jugadorAEnviar).subscribe({
      next: () => {
        alert("¡Jugador fichado con éxito!");
        this.cerrarModal();
        this.cargarMercado();
      },
      error: (err) => {
        alert("Error al intentar fichar al jugador. Revisar la consola.");
        console.error(err);
      }
    });
  }

  // --- Lógica del Mercado (Agentes Libres) ---
  miEquipoId: number | null = null;

  ficharAgenteLibre(jugador: any) {
     if (!this.miEquipoId) {
         alert('Por favor, selecciona primero "Tu Equipo" en la parte superior para saber dónde hacer el traspaso.');
         return;
     }

     const equipoDestino = this.equipos.find(e => e.id == this.miEquipoId);
     const confirmacion = window.confirm(`¿Fichar a ${jugador.nombre} para ${equipoDestino.nombre}?`);

     if (confirmacion) {
        const url = `http://localhost:8080/api/jugadores/${jugador.id}`;
        
        // Fichamos para el equipo seleccionado en el panel superior
        const payload = { ...jugador, equipo: equipoDestino };
        
        this.http.put(url, payload).subscribe({
           next: () => {
              this.cargarMercado();
              alert(`¡Fichaje completado! ${jugador.nombre} ahora viste los colores de ${equipoDestino.nombre}`);
           },
           error: (err) => {
              if (err.status === 403) {
                 alert("Fichaje bloqueado (Error 403): Tu usuario actual no tiene permiso de Administrador para modificar jugadores.");
              } else {
                 alert("Error en el traspaso de jugador. Revisa la consola.");
              }
           }
        });
     }
  }

}
