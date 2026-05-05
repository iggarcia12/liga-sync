import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

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
export class RegistroComponent implements OnInit {
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
  modoLiga = false;

  sugerenciasLiga: LigaBuscada[] = [];
  mostrarSugerencias = false;
  private debounceTimer: any = null;

  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private readonly API = 'http://localhost:8080/api';

  ngOnInit(): void {
    this.modoLiga = this.route.snapshot.queryParamMap.get('mode') === 'liga';
  }

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
        `${this.API}/ligas/buscar?q=${encodeURIComponent(query)}${filtro}`
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

    if (!this.nombreLiga.trim()) {
      this.mensajeError = this.tipoAccion === 'CREAR'
        ? 'Escribe un nombre para tu liga.'
        : 'Escribe el nombre de la liga a la que quieres unirte.';
      return;
    }

    if (this.modoLiga) {
      this.asignarLigaGoogle();
      return;
    }

    if (this.pass !== this.confirmarPass) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }
    if (this.pass.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
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

    this.http.post<any>(`${this.API}/auth/registro`, body).subscribe({
      next: (res) => {
        const ligaTexto = this.tipoAccion === 'CREAR'
          ? `¡Liga "${this.nombreLiga}" creada! Rol asignado: ${res.rol}.`
          : `¡Te has unido a "${this.nombreLiga}"! Rol asignado: ${res.rol}.`;
        this.mensajeExito = `${ligaTexto} Redirigiendo al login...`;
        setTimeout(() => this.router.navigate(['/login']), 2200);
      },
      error: (err) => {
        console.error('Error en registro:', err);
        this.manejarError(err);
        this.cargando = false;
      }
    });
  }

  private asignarLigaGoogle() {
    this.cargando = true;
    const body = {
      tipoAccion: this.tipoAccion,
      nombreLiga: this.nombreLiga.trim(),
      deporte: this.tipoAccion === 'CREAR' ? this.deporte : undefined
    };

    this.http.post<any>(`${this.API}/auth/asignar-liga`, body).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('rol', res.rol);
        localStorage.setItem('userId', res.userId?.toString() ?? '');
        localStorage.setItem('nombre', res.usuario);
        localStorage.setItem('jugadorId', res.jugadorId?.toString() ?? '');
        localStorage.setItem('ligaId', res.ligaId?.toString() ?? '');
        localStorage.setItem('deporte', res.deporte ?? 'FUTBOL');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error al asignar liga:', err);
        this.manejarError(err);
        this.cargando = false;
      }
    });
  }

  private manejarError(err: any) {
    if (err.error?.error) {
      this.mensajeError = err.error.error;
    } else if (typeof err.error === 'string') {
      this.mensajeError = err.error;
    } else if (err.status === 409) {
      this.mensajeError = `Ya existe una liga con el nombre "${this.nombreLiga}".`;
    } else if (err.status === 404) {
      this.mensajeError = `No existe ninguna liga con el nombre "${this.nombreLiga}".`;
    } else {
      this.mensajeError = 'Error al conectar con el servidor. Inténtalo de nuevo.';
    }
  }
}
