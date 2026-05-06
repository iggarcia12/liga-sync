import { Component, OnInit, inject, ChangeDetectorRef, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css'
})
export class MensajesComponent implements OnInit, AfterViewChecked {

  @ViewChild('chatHistory') private chatHistoryEl!: ElementRef;

  readonly urlBase = environment.apiUrl + '/api';

  miId: number | null = null;
  miNombre: string | null = null;

  contactosActivos: any[] = [];

  textoBusqueda: string = '';
  resultadosBusqueda: any[] = [];
  todosUsuarios: any[] = [];
  buscando: boolean = false;
  mostrarBusqueda: boolean = false;

  contactoSeleccionado: any = null;
  mensajesActivos: any[] = [];
  nuevoMensaje: string = '';

  cargandoContactos: boolean = false;
  cargandoMensajes: boolean = false;
  enviando: boolean = false;

  private debeScrollear: boolean = false;

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.miId = this.auth.getUserId();
    this.miNombre = this.auth.getNombre();
    this.cargarContactosActivos();
    this.cargarTodosUsuarios();
  }

  ngAfterViewChecked() {
    if (this.debeScrollear) {
      this.scrollAlFinal();
      this.debeScrollear = false;
    }
  }

  cargarContactosActivos() {
    if (!this.miId) {
      this.cargandoContactos = false;
      return;
    }
    this.cargandoContactos = true;

    this.http.get<any[]>(`${this.urlBase}/mensajes/contactos/${this.miId}`).subscribe({
      next: (usuarios) => {
        this.contactosActivos = usuarios.filter(u => u.id !== this.miId);
        this.cargandoContactos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.contactosActivos = [];
        this.cargandoContactos = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Pre-carga del universo de usuarios para habilitar la búsqueda instantánea
  cargarTodosUsuarios() {
    this.http.get<any[]>(`${this.urlBase}/mensajes/usuarios`).subscribe({
      next: (usuarios) => {
        this.todosUsuarios = usuarios.filter(u => u.id !== this.miId);
      },
      error: () => { this.todosUsuarios = []; }
    });
  }

  buscarUsuarios() {
    const q = this.textoBusqueda.trim().toLowerCase();
    if (!q) {
      this.resultadosBusqueda = [];
      this.mostrarBusqueda = false;
      return;
    }
    this.mostrarBusqueda = true;
    this.resultadosBusqueda = this.todosUsuarios.filter(u =>
      u.nombre?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    ).slice(0, 8); 
  }

  limpiarBusqueda() {
    this.textoBusqueda = '';
    this.resultadosBusqueda = [];
    this.mostrarBusqueda = false;
  }

  seleccionarContacto(usuario: any) {
    this.contactoSeleccionado = usuario;
    this.mensajesActivos = [];
    this.limpiarBusqueda();

    const yaEstaEnActivos = this.contactosActivos.some(c => c.id === usuario.id);
    if (!yaEstaEnActivos) {
      this.contactosActivos = [usuario, ...this.contactosActivos];
    }

    this.cargarConversacion();
  }

  cargarConversacion() {
    if (!this.miId || !this.contactoSeleccionado) return;
    this.cargandoMensajes = true;

    this.http.get<any[]>(
      `${this.urlBase}/mensajes/conversacion?user1=${this.miId}&user2=${this.contactoSeleccionado.id}`
    ).subscribe({
      next: (msgs) => {
        this.mensajesActivos = msgs;
        this.cargandoMensajes = false;
        this.debeScrollear = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajesActivos = [];
        this.cargandoMensajes = false;
        this.cdr.detectChanges();
      }
    });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.contactoSeleccionado || !this.miId || this.enviando) {
      return;
    }

    this.enviando = true;
    const texto = this.nuevoMensaje.trim();
    this.nuevoMensaje = '';

    const payload = {
      remitenteId: this.miId,
      destinatarioId: this.contactoSeleccionado.id,
      contenido: texto
    };

    this.http.post<any>(this.urlBase + '/mensajes', payload).subscribe({
      next: (msgGuardado) => {
        this.mensajesActivos.push(msgGuardado);
        this.enviando = false;
        this.debeScrollear = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);
        this.nuevoMensaje = texto;
        this.enviando = false;
        alert('Error al enviar el mensaje. Comprueba tu conexión.');
        this.cdr.detectChanges();
      }
    });
  }

  esMio(mensaje: any): boolean {
    return mensaje.remitenteId === this.miId;
  }

  getInicial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  getRolLabel(role: string): string {
    if (!role) return 'Usuario';
    const r = role.toUpperCase();
    if (r === 'ADMIN') return 'Administrador';
    if (r === 'ENTRENADOR') return 'Entrenador';
    if (r === 'JUGADOR') return 'Jugador';
    if (r === 'ARBITRO') return 'Árbitro';
    if (r === 'ESPECTADOR') return 'Espectador';
    return role;
  }

  formatearHora(fecha: string): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  // Gestión automática del scroll al final del chat tras cambios en la vista
  private scrollAlFinal() {
    if (this.chatHistoryEl) {
      const el = this.chatHistoryEl.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
