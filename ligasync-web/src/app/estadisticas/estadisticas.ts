import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class EstadisticasComponent implements OnInit, AfterViewInit {
  cargando: boolean = true;
  jugadores: any[] = [];
  
  topGoleadores: any[] = [];
  topAsistencias: any[] = [];
  topRebotes: any[] = [];
  sancionados: any[] = [];

  @ViewChild('chartEquipos') chartCanvas!: ElementRef;
  chartInstance: any;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  ngOnInit() {
    this.cargarDatos();
  }

  ngAfterViewInit() {
    if (!this.cargando) {
      this.dibujarGrafico();
    }
  }

  cargarDatos() {
    this.cargando = true;
    const url = environment.apiUrl + '/api/jugadores';
    
    this.http.get<any[]>(url).pipe(
      catchError(err => { console.error('Error cargando estadísticas', err); return of([]); })
    ).subscribe(datos => {
      let result = datos;
      if (datos && (datos as any)._embedded) {
         result = (datos as any)._embedded.jugadores || [];
      }
      this.jugadores = result;
      this.procesarEstadisticas();
      this.cargando = false;
      this.cdr.detectChanges();
      
      if (this.chartCanvas) {
         this.dibujarGrafico();
      }
    });
  }

  procesarEstadisticas() {
    const jugadoresProcesados = this.jugadores.map((j, i) => ({
       ...j,
       goles: j.goles !== undefined ? j.goles : 0,
       asistencias: j.asist !== undefined ? j.asist : 0,
       rebotes: j.rebotes !== undefined ? j.rebotes : 0,
       tarjetasAmarillas: j.amarillas !== undefined ? j.amarillas : 0,
       tarjetasRojas: j.rojas !== undefined ? j.rojas : 0
    }));

    this.topGoleadores = [...jugadoresProcesados].sort((a, b) => b.goles - a.goles).slice(0, 5);
    this.topAsistencias = [...jugadoresProcesados].sort((a, b) => b.asistencias - a.asistencias).slice(0, 5);
    this.topRebotes = [...jugadoresProcesados].sort((a, b) => b.rebotes - a.rebotes).slice(0, 5);
    this.sancionados = [...jugadoresProcesados]
      .filter(j => j.tarjetasRojas > 0 || j.tarjetasAmarillas >= 1) // Bajamos a 1 para que se vea algo si hay pocas
      .sort((a, b) => (b.tarjetasRojas * 3 + b.tarjetasAmarillas) - (a.tarjetasRojas * 3 + a.tarjetasAmarillas))
      .slice(0, 5);
  }

  dibujarGrafico() {
    if (!this.chartCanvas || this.jugadores.length === 0) return;

    const equiposConteo: { [key: string]: number } = {};
    
    this.jugadores.forEach(j => {
       const nombreEq = j.equipo ? j.equipo.nombre : 'Agentes Libres';
       equiposConteo[nombreEq] = (equiposConteo[nombreEq] || 0) + 1;
    });

    const labels = Object.keys(equiposConteo);
    const data = Object.values(equiposConteo);

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#94a3b8'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
             position: 'bottom',
             labels: { color: '#64748b' }
          }
        },
        cutout: '70%'
      }
    });
  }
}
