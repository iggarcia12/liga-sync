import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-playoffs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playoffs.html',
  styleUrl: './playoffs.css'
})
export class PlayoffsComponent implements OnInit {
  todosPartidos: any[] = [];
  cargando = true;
  error = false;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  readonly urlBase = 'http://localhost:8080/api';

  ngOnInit() {
    this.cargarPartidos();
  }

  cargarPartidos() {
    this.cargando = true;
    this.http.get<any[]>(`${this.urlBase}/partidos`).subscribe({
      next: (data) => {
        this.todosPartidos = data.filter(p => p.tipoPartido && p.tipoPartido !== 'REGULAR');
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando play-offs:', err);
        this.error = true;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  getPartido(codigo: string): any | null {
    return this.todosPartidos.find(p => p.codigoEliminatoria === codigo) ?? null;
  }

  get c1(): any { return this.getPartido('CUARTOS_1'); }
  get c2(): any { return this.getPartido('CUARTOS_2'); }
  get c3(): any { return this.getPartido('CUARTOS_3'); }
  get c4(): any { return this.getPartido('CUARTOS_4'); }
  get s1(): any { return this.getPartido('SEMI_1'); }
  get s2(): any { return this.getPartido('SEMI_2'); }
  get f():  any { return this.getPartido('FINAL'); }

  get hayPlayoffs(): boolean { return this.todosPartidos.length > 0; }

  nombre(p: any, lado: 'local' | 'visitante'): string {
    return p?.[lado]?.nombre ?? 'Por determinar';
  }

  goles(p: any, lado: 'local' | 'visitante'): string {
    const g = lado === 'local' ? p?.golesLocal : p?.golesVisitante;
    return g !== null && g !== undefined ? String(g) : '-';
  }

  finalizado(p: any): boolean {
    return p?.estado === 'FINALIZADO_Y_FIRMADO';
  }

  ganador(p: any, lado: 'local' | 'visitante'): boolean {
    if (!this.finalizado(p)) return false;
    const gl = p.golesLocal ?? 0, gv = p.golesVisitante ?? 0;
    return lado === 'local' ? gl > gv : gv > gl;
  }

  get campeon(): string | null {
    if (!this.finalizado(this.f)) return null;
    return this.ganador(this.f, 'local') ? this.f.local?.nombre : this.f.visitante?.nombre;
  }

  etiqueta(p: any): string {
    const m: Record<string, string> = {
      CUARTOS_1: '1° vs 8°', CUARTOS_2: '4° vs 5°',
      CUARTOS_3: '2° vs 7°', CUARTOS_4: '3° vs 6°',
      SEMI_1: 'Semifinal A', SEMI_2: 'Semifinal B',
      FINAL: 'Gran Final'
    };
    return m[p?.codigoEliminatoria] ?? '';
  }
}
