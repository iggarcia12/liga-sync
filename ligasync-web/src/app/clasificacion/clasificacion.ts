import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-clasificacion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './clasificacion.html',
  styleUrl: './clasificacion.css'
})
export class ClasificacionComponent implements OnInit {
  equipos: any[] = [];
  cargando = true;
  error = false;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  readonly urlBase = 'http://localhost:8080/api';

  ngOnInit() {
    this.cargarClasificacion();
  }

  cargarClasificacion() {
    this.cargando = true;
    this.error = false;
    this.http.get<any>(this.urlBase + '/equipos').subscribe({
      next: (resp) => {
        this.equipos = resp._embedded ? resp._embedded.equipos : resp;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar la clasificación:', err);
        this.error = true;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get equiposOrdenados(): any[] {
    return [...this.equipos].sort((a, b) => {
      if ((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);
      const dgA = (a.gf || 0) - (a.gc || 0);
      const dgB = (b.gf || 0) - (b.gc || 0);
      if (dgB !== dgA) return dgB - dgA;
      return (b.gf || 0) - (a.gf || 0);
    });
  }

  diferenciaGoles(equipo: any): number {
    return (equipo.gf || 0) - (equipo.gc || 0);
  }

}
