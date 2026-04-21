import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

interface EstadisticasJugador {
  goles: number;
  asistencias: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  partidosJugados: number;
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css'
})
export class MiPerfilComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  nombre = this.authService.getNombre() ?? '';
  email = '';
  stats: EstadisticasJugador | null = null;
  cargando = true;

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.http.get<any>(`http://localhost:8080/api/usuarios/${userId}`).subscribe({
      next: (usuario) => {
        this.nombre = usuario.nombre;
        this.email = usuario.email;
      },
      error: (err) => console.error('Error al cargar perfil:', err)
    });

    this.http.get<any[]>('http://localhost:8080/api/jugadores').subscribe({
      next: (jugadores) => {
        const jugador = jugadores.find(j => j.usuarioId === userId);
        if (jugador) {
          this.stats = {
            goles: jugador.goles ?? 0,
            asistencias: jugador.asistencias ?? 0,
            tarjetasAmarillas: jugador.tarjetasAmarillas ?? 0,
            tarjetasRojas: jugador.tarjetasRojas ?? 0,
            partidosJugados: jugador.partidosJugados ?? 0
          };
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas del jugador:', err);
        this.cargando = false;
      }
    });
  }
}
