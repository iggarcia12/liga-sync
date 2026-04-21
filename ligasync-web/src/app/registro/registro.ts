import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

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
  mensajeError = '';
  mensajeExito = '';
  cargando = false;

  private http = inject(HttpClient);
  private router = inject(Router);

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

    this.cargando = true;
    const body = { nombre: this.nombre, email: this.email, pass: this.pass };

    this.http.post<any>('http://localhost:8080/api/auth/registro', body).subscribe({
      next: () => {
        this.mensajeExito = '¡Cuenta creada! Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: (err) => {
        console.error('Error en registro:', err);
        if (typeof err.error === 'string') {
          this.mensajeError = err.error;
        } else if (err.error && err.error.mensaje) {
          this.mensajeError = err.error.mensaje;
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
