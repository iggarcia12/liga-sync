import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface LigaBuscada {
  id: number;
  nombre: string;
  deporte: 'FUTBOL' | 'BALONCESTO';
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroComponent {
  nombre = '';
  email = '';
  pass = '';
  confirmarPass = '';
  tipoAccion: 'CREAR' | 'UNIRSE' = 'CREAR';
  nombreLiga = '';
  deporte: 'FUTBOL' | 'BALONCESTO' = 'FUTBOL';
  filtroDeporte: '' | 'FUTBOL' | 'BALONCESTO' = '';
  mensajeError = '';
  mensajeExito = '';
  cargando = false;

  sugerenciasLiga: LigaBuscada[] = [];
  mostrarSugerencias = false;
  private debounceTimer: any = null;

  private http = inject(HttpClient);
  private router = inject(Router);

  seleccionarAccion(tipo: 'CREAR' | 'UNIRSE') {
    this.tipoAccion = tipo;
    this.nombreLiga = '';
    this.mensajeError = '';
    this.sugerenciasLiga = [];
    this.mostrarSugerencias = false;
  }

  onBuscarLiga(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    clearTimeout(this.debounceTimer);
    if (query.trim().length < 2) {
      this.sugerenciasLiga = [];
      this.mostrarSugerencias = false;
      return;
    }
    this.debounceTimer = setTimeout(() => {
      const filtro = this.filtroDeporte ? `&deporte=${this.filtroDeporte}` : '';
      this.http.get<LigaBuscada[]>(
        `http://localhost:8080/api/ligas/buscar?q=${encodeURIComponent(query)}${filtro}`
      ).subscribe({
        next: (res) => {
          this.sugerenciasLiga = res;
          this.mostrarSugerencias = res.length > 0;
        },
        error: (err) => console.error('Error buscando ligas:', err)
      });
    }, 300);
  }

  onFiltroDeporteChange() {
    // Relanza la búsqueda si ya hay texto
    if (this.nombreLiga.trim().length >= 2) {
      const fakeEvent = { target: { value: this.nombreLiga } } as any;
      this.onBuscarLiga(fakeEvent);
    }
  }

  seleccionarLiga(liga: LigaBuscada) {
    this.nombreLiga = liga.nombre;
    this.mostrarSugerencias = false;
    this.sugerenciasLiga = [];
  }

  ocultarSugerencias() {
    setTimeout(() => { this.mostrarSugerencias = false; }, 150);
  }

  iconoDeporte(deporte: 'FUTBOL' | 'BALONCESTO'): string {
    return deporte === 'BALONCESTO' ? '🏀' : '⚽';
  }

  registrar() {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (this.pass !== this.confirmarPass) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }
    if (this.pass.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (!this.nombreLiga.trim()) {
      this.mensajeError = this.tipoAccion === 'CREAR'
        ? 'Escribe un nombre para tu liga.'
        : 'Escribe el nombre de la liga a la que quieres unirte.';
      return;
    }

    this.cargando = true;
    const body = {
      nombre: this.nombre,
      email: this.email,
      pass: this.pass,
      tipoAccion: this.tipoAccion,
      nombreLiga: this.nombreLiga.trim(),
      deporte: this.tipoAccion === 'CREAR' ? this.deporte : undefined
    };

    this.http.post<any>('http://localhost:8080/api/auth/registro', body).subscribe({
      next: (res) => {
        const ligaTexto = this.tipoAccion === 'CREAR'
          ? `¡Liga "${this.nombreLiga}" creada! Rol asignado: ${res.rol}.`
          : `¡Te has unido a "${this.nombreLiga}"! Rol asignado: ${res.rol}.`;
        this.mensajeExito = `${ligaTexto} Redirigiendo al login...`;
        setTimeout(() => this.router.navigate(['/login']), 2200);
      },
      error: (err) => {
        console.error('Error en registro:', err);
        if (typeof err.error === 'string') {
          this.mensajeError = err.error;
        } else if (err.error?.mensaje) {
          this.mensajeError = err.error.mensaje;
        } else if (err.status === 409) {
          this.mensajeError = `Ya existe una liga con el nombre "${this.nombreLiga}".`;
        } else if (err.status === 404) {
          this.mensajeError = `No existe ninguna liga con el nombre "${this.nombreLiga}".`;
        } else if (err.status === 403) {
          this.mensajeError = 'Error de permisos (403). Contacta con el administrador.';
        } else {
          this.mensajeError = 'Error al conectar con el servidor. Inténtalo de nuevo.';
        }
        this.cargando = false;
      }
    });
  }
}
