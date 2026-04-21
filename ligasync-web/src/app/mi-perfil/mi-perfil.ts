import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css'
})
export class MiPerfilComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  readonly urlBase = 'http://localhost:8080/api';

  nombre = this.authService.getNombre() ?? '';
  email = '';
  jugador: any = null;
  cargando = true;

  ngOnInit() {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.cargando = false;
      return;
    }

    // Primero cargamos el usuario para obtener su jugadorId actualizado desde el servidor
    this.http.get<any>(`${this.urlBase}/usuarios/${userId}`).subscribe({
      next: (usuario) => {
        this.nombre = usuario.nombre;
        this.email = usuario.email;

        if (usuario.jugadorId) {
          this.http.get<any>(`${this.urlBase}/jugadores/${usuario.jugadorId}`).subscribe({
            next: (j) => {
              this.jugador = j;
              this.cargando = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Error al cargar ficha del jugador:', err);
              this.cargando = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error al cargar datos del usuario:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
