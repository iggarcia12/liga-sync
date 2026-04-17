import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // <-- 1. Importar Router

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email: string = '';
  pass: string = '';
  mensajeError: string = '';

  private http = inject(HttpClient);
  private router = inject(Router); // <-- 2. Inyectar el Router

  hacerLogin() {
    // 🚨 RECUERDA PONER TU URL REAL DE IDX AQUÍ
    const urlBackend = 'http://localhost:8080/api/login'; 
    
    const datosEnvio = { email: this.email, pass: this.pass };

    this.http.post<any>(urlBackend, datosEnvio).subscribe({
      next: (respuesta) => {
        // Guardamos el token y el rol de usuario
        localStorage.setItem('token', respuesta.token);
        localStorage.setItem('rol', respuesta.rol);
        
        // 3. ¡Mágia! Cambiamos de página automáticamente al Dashboard
        this.router.navigate(['/dashboard']); 
      },
      error: (err) => {
        this.mensajeError = 'Credenciales incorrectas. Inténtalo de nuevo.';
      }
    });
  }
}