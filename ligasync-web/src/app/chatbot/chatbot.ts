import { Component, ChangeDetectorRef, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Opcion {
  pregunta: string;
  respuesta: string;
}

interface Categoria {
  nombre: string;
  icono: string;
  opciones: Opcion[];
}

interface Mensaje {
  texto: string;
  emisor: 'bot' | 'user';
}

interface MapeoKeyword {
  palabras: string[];
  respuesta: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent {
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('mensajesRef') private mensajesRef!: ElementRef<HTMLDivElement>;

  isOpen    = false;
  isTyping  = false;
  inputTexto = '';

  historial: Mensaje[] = [
    { texto: '¡Hola! Soy el asistente de LigaSync. Selecciona una pregunta o escríbeme directamente.', emisor: 'bot' }
  ];

  categorias: Categoria[] = [
    {
      nombre: 'Mi Equipo',
      icono: '🛡️',
      opciones: [
        {
          pregunta: '¿Cómo edito mi equipo?',
          respuesta: 'Accede a "Mi Equipo" en el menú lateral. Desde ahí puedes cambiar el nombre, el escudo y los datos generales. Solo el entrenador o un administrador tienen permisos para editar.'
        },
        {
          pregunta: '¿Cómo añado jugadores a mi plantilla?',
          respuesta: 'En "Mi Equipo" ve a la pestaña "Plantilla" y pulsa el botón "+ Añadir Jugador". Rellena sus datos y el jugador quedará vinculado a tu equipo inmediatamente.'
        },
        {
          pregunta: '¿Cómo veo las estadísticas de mis jugadores?',
          respuesta: 'En la sección "Mi Equipo" encontrarás un panel de estadísticas por jugador con goles, asistencias, tarjetas y minutos jugados, actualizado tras cada jornada.'
        }
      ]
    },
    {
      nombre: 'Liga & Competición',
      icono: '🏆',
      opciones: [
        {
          pregunta: '¿Cómo veo la clasificación?',
          respuesta: 'La clasificación en tiempo real está en la sección "Clasificación" del menú. Se actualiza automáticamente tras registrar los resultados de cada jornada.'
        },
        {
          pregunta: '¿Cómo consulto los partidos programados?',
          respuesta: 'En "Partidos" verás el calendario completo con fechas, rivales y resultados. Puedes filtrar por jornada o por equipo para localizar rápidamente lo que buscas.'
        },
        {
          pregunta: '¿Cómo funcionan los playoffs?',
          respuesta: 'Al concluir la fase regular, los equipos clasificados pasan a eliminatorias. Los emparejamientos se generan automáticamente según posición (1.º vs último, etc.) y el formato lo define el administrador de la liga.'
        }
      ]
    },
    {
      nombre: 'Cuenta & Soporte',
      icono: '⚙️',
      opciones: [
        {
          pregunta: '¿Qué roles existen en LigaSync?',
          respuesta: 'Existen cuatro roles: Administrador (gestiona la liga), Entrenador (gestiona su equipo), Jugador (consulta su información) y Árbitro (accede a los partidos asignados). El administrador asigna los roles.'
        },
        {
          pregunta: '¿Cómo contacto al administrador?',
          respuesta: 'Usa la sección "Mensajes" del menú lateral para enviarle un mensaje directo. El administrador recibirá una notificación y podrá responderte desde su panel.'
        }
      ]
    }
  ];

  private keywordMap: MapeoKeyword[] = [
    {
      palabras: ['edito', 'editar', 'cambiar equipo', 'nombre equipo', 'escudo'],
      respuesta: 'Accede a "Mi Equipo" en el menú lateral. Desde ahí puedes cambiar el nombre, el escudo y los datos generales. Solo el entrenador o un administrador tienen permisos para editar.'
    },
    {
      palabras: ['jugador', 'jugadores', 'plantilla', 'añadir', 'añado', 'fichar'],
      respuesta: 'En "Mi Equipo" ve a la pestaña "Plantilla" y pulsa el botón "+ Añadir Jugador". Rellena sus datos y el jugador quedará vinculado a tu equipo inmediatamente.'
    },
    {
      palabras: ['estadistica', 'estadisticas', 'goles', 'asistencias', 'tarjetas', 'stats'],
      respuesta: 'En la sección "Mi Equipo" encontrarás un panel de estadísticas por jugador con goles, asistencias, tarjetas y minutos jugados, actualizado tras cada jornada.'
    },
    {
      palabras: ['clasificacion', 'tabla', 'posicion', 'ranking', 'primero', 'lider'],
      respuesta: 'La clasificación en tiempo real está en la sección "Clasificación" del menú. Se actualiza automáticamente tras registrar los resultados de cada jornada.'
    },
    {
      palabras: ['partido', 'partidos', 'calendario', 'jornada', 'horario'],
      respuesta: 'En "Partidos" verás el calendario completo con fechas, rivales y resultados. Puedes filtrar por jornada o por equipo para localizar rápidamente lo que buscas.'
    },
    {
      palabras: ['playoff', 'playoffs', 'eliminatoria', 'eliminatorias', 'copa'],
      respuesta: 'Al concluir la fase regular, los equipos clasificados pasan a eliminatorias. Los emparejamientos se generan automáticamente según posición (1.º vs último, etc.) y el formato lo define el administrador de la liga.'
    },
    {
      palabras: ['rol', 'roles', 'permiso', 'permisos', 'arbitro', 'entrenador', 'espectador'],
      respuesta: 'Existen cuatro roles: Administrador (gestiona la liga), Entrenador (gestiona su equipo), Jugador (consulta su información) y Árbitro (accede a los partidos asignados). El administrador asigna los roles.'
    },
    {
      palabras: ['admin', 'administrador', 'contactar', 'contacto', 'mensaje', 'mensajes', 'ayuda'],
      respuesta: 'Usa la sección "Mensajes" del menú lateral para enviarle un mensaje directo. El administrador recibirá una notificación y podrá responderte desde su panel.'
    }
  ];

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  seleccionarOpcion(opcion: Opcion): void {
    if (this.isTyping) return;
    this.pushMensajeUsuario(opcion.pregunta);
    this.responderDespuesDeDelay(opcion.respuesta);
  }

  enviarMensaje(): void {
    const texto = this.inputTexto.trim();
    if (!texto || this.isTyping) return;

    this.inputTexto = '';
    this.pushMensajeUsuario(texto);

    const textoNorm = this.normalizar(texto);
    const match = this.keywordMap.find(kw =>
      kw.palabras.some(p => textoNorm.includes(this.normalizar(p)))
    );

    const respuesta = match
      ? match.respuesta
      : 'No he entendido tu pregunta, pero puedes probar con estas opciones:';

    this.responderDespuesDeDelay(respuesta);
  }

  private pushMensajeUsuario(texto: string): void {
    this.historial.push({ texto, emisor: 'user' });
    this.isTyping = true;
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 0);
  }

  private responderDespuesDeDelay(respuesta: string): void {
    setTimeout(() => {
      this.historial.push({ texto: respuesta, emisor: 'bot' });
      this.isTyping = false;
      this.cdr.detectChanges();
      setTimeout(() => this.scrollToBottom(), 0);
    }, 800);
  }

  private scrollToBottom(): void {
    if (!this.mensajesRef?.nativeElement) return;
    const el = this.mensajesRef.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }
}
