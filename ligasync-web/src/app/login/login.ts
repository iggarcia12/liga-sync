import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email: string = '';
  pass: string = '';
  mensajeError: string = '';

  private http = inject(HttpClient);
  private router = inject(Router);

  hacerLogin() {
    const urlBackend = 'http://localhost:8080/api/login'; 
    const datosEnvio = { email: this.email, pass: this.pass };

    this.http.post<any>(urlBackend, datosEnvio).subscribe({
      next: (respuesta) => {
        localStorage.setItem('token', respuesta.token);
        localStorage.setItem('rol', respuesta.rol);
        localStorage.setItem('userId', respuesta.userId?.toString() ?? '');
        localStorage.setItem('nombre', respuesta.usuario);
        localStorage.setItem('jugadorId', respuesta.jugadorId?.toString() ?? '');
        
        this.router.navigate(['/dashboard']); 
      },
      error: () => {
        this.mensajeError = 'Credenciales incorrectas. Inténtalo de nuevo.';
      }
    });
  }
}