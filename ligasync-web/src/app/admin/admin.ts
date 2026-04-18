import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {

  readonly urlBase = 'http://localhost:8080/api';

  usuarios: any[] = [];
  cargandoUsuarios: boolean = true;

  metricas = {
    totalUsuarios: 0,
    partidosJugados: 0,
    equiposRegistrados: 0
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. Cargar usuarios reales
    this.http.get<any[]>(this.urlBase + '/usuarios').subscribe({
      next: (datos) => {
        this.usuarios = datos;
        this.metricas.totalUsuarios = datos.length;
        this.cargandoUsuarios = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoUsuarios = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Cargar partidos reales
    this.http.get<any[]>(this.urlBase + '/partidos').subscribe(datos => {
      this.metricas.partidosJugados = datos.filter(
        p => p.golesLocal !== null && p.golesLocal !== undefined
      ).length;
      this.cdr.detectChanges();
    });

    // 3. Cargar equipos reales
    this.http.get<any[]>(this.urlBase + '/equipos').subscribe(datos => {
      this.metricas.equiposRegistrados = datos.length;
      this.cdr.detectChanges();
    });
  }

  eliminarUsuario(id: number) {
    if (confirm('ATENCIÓN: ¿Estás seguro de que deseas eliminar a este usuario permanentemente?')) {
      this.http.delete(this.urlBase + '/usuarios/' + id).subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.id !== id);
          this.metricas.totalUsuarios = this.usuarios.length;
          this.cdr.detectChanges();
          alert('Usuario eliminado correctamente.');
        },
        error: () => {
          alert('Error al eliminar el usuario. Inténtalo de nuevo.');
        }
      });
    }
  }

  getRolClass(rol: string): string {
    if (!rol) return 'badge-user';
    const r = rol.toUpperCase();
    if (r === 'ADMIN') return 'badge-admin';
    if (r === 'BANNED') return 'badge-banned';
    return 'badge-user';
  }

  getInitial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }
}
