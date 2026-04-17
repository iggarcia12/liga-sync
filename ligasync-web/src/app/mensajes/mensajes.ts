import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css'
})
export class MensajesComponent {
  
  contactos = [
    { id: 1, nombre: 'Jürgen Klopp', equipo: 'Directiva FC', avatar: 'J', unread: 2, lastMsg: 'Tengo un par de defensas que quiero probar.' },
    { id: 2, nombre: 'Pep Guardiola', equipo: 'Cityzen Club', avatar: 'P', unread: 0, lastMsg: '¿Tienes 200 millones? Jajaja' },
    { id: 3, nombre: 'Carlo Ancelotti', equipo: 'Madrilista', avatar: 'C', unread: 0, lastMsg: 'Hola, buenas tardes.' }
  ];

  contactoSeleccionado: any = null;

  historialConversaciones: { [key: number]: any[] } = {
    1: [
      { sender: 'them', text: 'Hey, vi que andas fichando libres. ¿Interesado en un amistoso?', time: '10:00' },
      { sender: 'them', text: 'Tengo un par de defensas que quiero probar.', time: '10:02' }
    ],
    2: [
      { sender: 'me', text: 'Hola Pep, ¿vendes a tu mejor mediocentro?', time: 'Ayer' },
      { sender: 'them', text: '¿Tienes 200 millones? Jajaja', time: 'Ayer' }
    ],
    3: [
      { sender: 'them', text: 'Hola, buenas tardes.', time: '12:00' }
    ]
  };

  mensajesActivos: any[] = [];
  nuevoMensaje: string = '';

  seleccionarContacto(c: any) {
    this.contactoSeleccionado = c;
    c.unread = 0; // Marcar como leído
    this.mensajesActivos = this.historialConversaciones[c.id];
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.contactoSeleccionado) return;
    
    // Nuestro mensaje
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.mensajesActivos.push({ sender: 'me', text: this.nuevoMensaje, time: hora });
    
    // Actualizar resumen contacto
    this.contactoSeleccionado.lastMsg = this.nuevoMensaje;
    this.nuevoMensaje = '';

    // Timeout para auto-respuesta
    setTimeout(() => {
      const respHora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const respuestaMsg = 'Recibido. Me pondré en contacto con mi directiva al respecto.';
      this.mensajesActivos.push({ sender: 'them', text: respuestaMsg, time: respHora });
      this.contactoSeleccionado.lastMsg = respuestaMsg;
    }, 1500);
  }
}
