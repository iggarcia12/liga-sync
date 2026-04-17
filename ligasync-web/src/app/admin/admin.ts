import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  
  usuarios = [
    { id: 1, email: 'admin@admin.com', nombre: 'Super Administrador', rol: 'ADMIN', lastLogin: 'Hace 5 min' },
    { id: 2, email: 'jugador1@user.com', nombre: 'Juan Pérez', rol: 'USER', lastLogin: 'Hace 2 horas' },
    { id: 3, email: 'mister@user.com', nombre: 'José Luis', rol: 'USER', lastLogin: 'Ayer' },
    { id: 4, email: 'hacker@malicioso.com', nombre: 'Suspendido', rol: 'BANNED', lastLogin: 'Nunca' }
  ];

  metricas = {
    totalUsuarios: 250,
    partidosJugados: 124,
    equiposRegistrados: 20
  };

  ngOnInit() {
    // Aquí cargaríamos datos del backend protegidos con 'hasRole(ADMIN)'
  }

  eliminarUsuario(id: number) {
    if(confirm('ATENCIÓN: ¿Estás seguro de que deseas eliminar a este usuario permanentemente?')) {
      this.usuarios = this.usuarios.filter(u => u.id !== id);
      alert('Usuario eliminado correctamente (Simulado).');
    }
  }
}
