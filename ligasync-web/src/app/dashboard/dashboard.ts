import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  jugadores: any[] = [];
  equipos: any[] = [];
  partidos: any[] = [];
  noticias: any[] = [];

  // Variables para las tarjetas de estadísticas
  totalJugadores: number = 0;
  totalEquipos: number = 0;
  partidosJugados: number = 0;
  cargandoNoticias: boolean = true;
  generandoPlayoffs = false;
  mensajePlayoffs = '';
  hayErrorPlayoffs = false;

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private auth = inject(AuthService);

  get esBasket(): boolean { return this.auth.esBaloncesto(); }
  get labelGoleadores(): string { return this.esBasket ? 'Top Anotadores' : 'Top Goleadores'; }
  get iconoDeporte(): string { return this.esBasket ? '🏀' : '⚽'; }
  get labelGoles(): string { return this.esBasket ? 'Pts' : 'Goles'; }

  readonly urlBase = environment.apiUrl + '/api';

  ngOnInit() {
    this.cargarEstadisticas();
    this.cargarNoticias();
  }

  cargarEstadisticas() {
    // 1. Jugadores
    this.http.get<any>(this.urlBase + '/jugadores').subscribe(resp => {
      this.jugadores = resp._embedded ? resp._embedded.jugadores : resp;
      this.totalJugadores = this.jugadores.length;
      this.cdr.detectChanges();
    });

    // 2. Equipos
    this.http.get<any>(this.urlBase + '/equipos').subscribe(resp => {
      this.equipos = resp._embedded ? resp._embedded.equipos : resp;
      this.totalEquipos = this.equipos.length;
      this.cdr.detectChanges();
    });

    // 3. Partidos
    this.http.get<any>(this.urlBase + '/partidos').subscribe(resp => {
      this.partidos = resp._embedded ? resp._embedded.partidos : resp;
      this.partidosJugados = this.partidos.filter(p => p.golesLocal !== null && p.golesLocal !== undefined).length;
      this.cdr.detectChanges();
    });
  }

  cargarNoticias() {
    this.cargandoNoticias = true;
    this.http.get<any[]>(this.urlBase + '/noticias').subscribe({
      next: (datos) => {
        // Mostrar las últimas 8 noticias
        this.noticias = datos.slice(0, 8);
        this.cargandoNoticias = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.noticias = [];
        this.cargandoNoticias = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Devuelve el icono según el tipo de noticia (detectado por título)
  getIconoNoticia(noticia: any): string {
    const titulo = (noticia.titulo || '').toLowerCase();
    if (titulo.includes('resultado') || titulo.includes('gol') || titulo.includes(' - ')) return '⚽';
    if (titulo.includes('fichaje') || titulo.includes('ficha') || titulo.includes('mercado')) return '🤝';
    if (titulo.includes('alerta') || titulo.includes('sanción') || titulo.includes('tarjeta')) return '🚨';
    if (titulo.includes('jornada') || titulo.includes('partido')) return '📅';
    return '📰';
  }

  // Formatea la fecha de la noticia de manera legible
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return fecha;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return fecha;
    }
  }

  get equiposOrdenados(): any[] {
    return [...this.equipos].sort((a, b) => {
      // 1. Puntos
      if ((b.pts || 0) !== (a.pts || 0)) {
        return (b.pts || 0) - (a.pts || 0);
      }
      // 2. Diferencia de goles
      const dgA = (a.gf || 0) - (a.gc || 0);
      const dgB = (b.gf || 0) - (b.gc || 0);
      if (dgB !== dgA) {
        return dgB - dgA;
      }
      // 3. Goles a favor
      return (b.gf || 0) - (a.gf || 0);
    });
  }

  get totalDeudaLiga(): number {
    return this.equipos.reduce((acc, e) => acc + (e.deudaAcumulada || 0), 0);
  }

  get equiposConDeuda(): any[] {
    return this.equipos.filter(e => (e.deudaAcumulada || 0) > 0);
  }

  get ultimoPartido(): any | null {
    const jugados = this.partidos.filter(p => p.golesLocal !== null && p.golesLocal !== undefined);
    return jugados.length > 0 ? jugados[jugados.length - 1] : null;
  }

  generarPlayoffs() {
    this.generandoPlayoffs = true;
    this.mensajePlayoffs = '';
    this.hayErrorPlayoffs = false;
    this.http.post(`${this.urlBase}/partidos/generar-playoffs`, {}).subscribe({
      next: () => {
        this.mensajePlayoffs = '¡Play-offs generados! 4 partidos de cuartos listos.';
        this.hayErrorPlayoffs = false;
        this.generandoPlayoffs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al generar play-offs:', err);
        this.mensajePlayoffs = err.error || 'Error al generar los play-offs.';
        this.hayErrorPlayoffs = true;
        this.generandoPlayoffs = false;
        this.cdr.detectChanges();
      }
    });
  }

  get topGoleadores(): any[] {
    return [...this.jugadores]
      .sort((a, b) => (b.goles || 0) - (a.goles || 0))
      .slice(0, 3);
  }
}