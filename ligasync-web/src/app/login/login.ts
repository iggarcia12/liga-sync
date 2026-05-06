import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

declare const google: any;

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements AfterViewInit {
  email: string = '';
  pass: string = '';
  mensajeError: string = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  public authService = inject(AuthService);

  private readonly API = environment.apiUrl + '/api';
  private readonly GOOGLE_CLIENT_ID =
    '376016123168-3imb1gjhio93hvluq74b7scf52jpvbf9.apps.googleusercontent.com';

  ngAfterViewInit(): void {
    this.cargarScriptGoogle().then(() => {
      google.accounts.id.initialize({
        client_id: this.GOOGLE_CLIENT_ID,
        callback: (response: any) => this.handleGoogleCredential(response)
      });
      const container = document.getElementById('google-btn-container');
      const ancho = container?.offsetWidth || 360;
      google.accounts.id.renderButton(
        container,
        { theme: 'outline', size: 'large', width: ancho, locale: 'es' }
      );
    });
  }

  private cargarScriptGoogle(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private handleGoogleCredential(response: { credential: string }): void {
    this.http.post<any>(`${this.API}/auth/google`, { token: response.credential }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('rol', res.rol);
        localStorage.setItem('userId', res.userId?.toString() ?? '');
        localStorage.setItem('nombre', res.usuario);
        localStorage.setItem('jugadorId', res.jugadorId?.toString() ?? '');
        localStorage.setItem('ligaId', res.ligaId?.toString() ?? '');
        localStorage.setItem('deporte', res.deporte ?? 'FUTBOL');
        if (res.needsLiga) {
          this.router.navigate(['/registro'], { queryParams: { mode: 'liga' } });
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error('Error en login con Google:', err);
        this.mensajeError = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
      }
    });
  }

  hacerLogin() {
    this.http.post<any>(`${this.API}/login`, { email: this.email, pass: this.pass }).subscribe({
      next: (respuesta) => {
        localStorage.setItem('token', respuesta.token);
        localStorage.setItem('rol', respuesta.rol);
        localStorage.setItem('userId', respuesta.userId?.toString() ?? '');
        localStorage.setItem('nombre', respuesta.usuario);
        localStorage.setItem('jugadorId', respuesta.jugadorId?.toString() ?? '');
        localStorage.setItem('ligaId', respuesta.ligaId?.toString() ?? '');
        localStorage.setItem('deporte', respuesta.deporte ?? 'FUTBOL');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.mensajeError = 'Credenciales incorrectas. Inténtalo de nuevo.';
      }
    });
  }
}
