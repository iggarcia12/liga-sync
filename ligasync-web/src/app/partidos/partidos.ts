import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-partidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partidos.html',
  styleUrl: './partidos.css'
})
export class PartidosComponent implements OnInit {
  partidos: any[] = [];
  cargando: boolean = true;
  
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  get esAdmin(): boolean { return this.authService.isAdmin(); }

  ngOnInit() {
    this.cargarPartidos();
  }

  cargarPartidos() {
    // Cambiado para usar el servidor local en lugar del entorno de producción
    const urlPartidos = 'http://localhost:8080/api/partidos'; 

    this.http.get<any[]>(urlPartidos).subscribe({
      next: (datos) => {
        this.partidos = datos;
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Error al cargar los partidos", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}