import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  jugadores: any[] = [];
  equipos: any[] = [];
  partidos: any[] = [];

  // Variables para las tarjetas de estadísticas
  totalJugadores: number = 0;
  totalEquipos: number = 0;
  partidosJugados: number = 0;

  // Mock de Noticias para el feed
  noticiasRecientes = [
    { id: 1, tipo: 'fichaje', texto: 'Lamine Yamal ficha por el FC Barcelona por 15M€.', fecha: 'Hace 2 horas', icono: '🤝' },
    { id: 2, tipo: 'partido', texto: 'Real Madrid 2 - 1 Atlético de Madrid.', fecha: 'Hace 5 horas', icono: '⚽' },
    { id: 3, tipo: 'alerta', texto: 'Se ha abierto el Mercado de Fichajes de Invierno.', fecha: 'Ayer', icono: '🚨' }
  ];

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    // 🚨 PON AQUÍ TU URL REAL (Solo la parte hasta /api)
    const urlBase = 'http://localhost:8080/api'; 

    // 1. Pedimos Jugadores
    this.http.get<any[]>(urlBase + '/jugadores').subscribe(datos => {
      this.jugadores = datos;
      this.totalJugadores = datos.length;
      this.cdr.detectChanges();
    });

    // 2. Pedimos Equipos
    this.http.get<any[]>(urlBase + '/equipos').subscribe(datos => {
      this.equipos = datos;
      this.totalEquipos = datos.length;
      this.cdr.detectChanges();
    });

    // 3. Pedimos Partidos
    this.http.get<any[]>(urlBase + '/partidos').subscribe(datos => {
      this.partidos = datos;
      this.partidosJugados = datos.filter(p => p.golesLocal !== null).length;
      this.cdr.detectChanges();
    });
  }
}