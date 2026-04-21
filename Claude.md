# Contexto del Proyecto: LigaSync

Actúa como un Desarrollador Full-Stack Senior experto en Angular (Frontend) y Spring Boot (Backend).
Este proyecto es una aplicación de gestión deportiva ("LigaSync").
El objetivo principal es mantener la coherencia arquitectónica, evitar la repetición de código (DRY) y priorizar la seguridad.

## 🛠️ Stack Tecnológico

- **Frontend**: Angular (Componentes Standalone), HTML5, CSS3 (sin preprocesadores).
- **Backend**: Java, Spring Boot, Spring Data JPA, Spring Security.
- **Base de Datos**: PostgreSQL (Supabase).
- **Autenticación**: JWT (JSON Web Tokens).

## 📐 Reglas de Arquitectura Frontend (Angular)

1. **Componentes Standalone**: No usamos `app.module.ts`. Todos los componentes (Dashboard, Equipos, Partidos, etc.) deben ser `standalone: true`.
2. **Inyección de Dependencias**: Preferimos usar la función `inject()` (ej. `private http = inject(HttpClient);`) en lugar de inyectar en el constructor para mantener el código más limpio.
3. **Peticiones HTTP**: Se realizan usando `HttpClient`.
   - 🚨 **REGLA DE ORO**: NUNCA añadas el token JWT manualmente en las cabeceras (`HttpHeaders`) dentro de los componentes. Tenemos un `auth-interceptor.ts` que ya se encarga de inyectar el token automáticamente en todas las peticiones salientes.
4. **Protección de Rutas**: Todas las rutas privadas en `app.routes.ts` deben estar protegidas por `auth-guard.ts` (y `admin-guard.ts` si requieren permisos de administrador).
5. **Gestión de Estado Simple**: Guardamos el `token` y el `role` del usuario logueado en el `localStorage`.

## 🏗️ Reglas de Arquitectura Backend (Spring Boot)

1. **Estructura de Paquetes**: Mantenemos la lógica dividida en `model` (Entidades JPA), `repository` (Interfaces JpaRepository), `controller` (Controladores REST), `dto` (Objetos de transferencia) y `security` (Filtros y utilidades JWT).
2. **Controladores REST**:
   - Todos deben llevar `@RestController` y `@RequestMapping("/api/...")`.
   - Deben devolver `ResponseEntity<?>` para manejar correctamente los códigos de estado HTTP (200, 400, 401, 404).
3. **Seguridad y JWT**:
   - Los endpoints están protegidos por `SecurityConfig.java` y `JwtFilter.java`.
   - Las contraseñas en la base de datos están encriptadas con `BCrypt`.
   - Al hacer login, el `AuthController` siempre debe devolver el token Y el rol del usuario (ej. `{ "token": "...", "role": "admin" }`).

## 🎨 Estilo Visual y UI (CSS Puro)

- **Directriz Principal**: Aplicamos los principios de la skill `frontend-design` de Anthropics. Huye de la estética genérica de la IA.
- **Dirección Estética de LigaSync**: "Editorial Deportivo Moderno / Panel de Alto Rendimiento". Uso de fondos limpios (o muy oscuros para modo dark), tipografías display con carácter para los encabezados (ej. Bebas Neue, Montserrat o similar) y alto contraste en los acentos de color.
- **Arquitectura CSS**: Cero Tailwind/Bootstrap. Uso extensivo de variables CSS (`:root`), animaciones fluidas (transiciones de hover, micro-interacciones) y grid/flexbox para composiciones espaciales dinámicas.
- **Componentes**:
  - Tarjetas (Cards) con sombras suaves, bordes refinados y uso del espacio negativo (generous padding).
  - Ventanas Modales (`.modal-overlay`) con efecto `backdrop-filter: blur()`.
- Nomenclatura de clases BEM simplificada en español (ej. `.card-jugador`, `.panel-stats__numero`).

## 🤖 Instrucciones para la IA (Cómo debes responder)

1. **Paso a paso**: Cuando te pida una nueva funcionalidad, no me des todo el código de golpe. Dime primero qué archivos vamos a tocar y luego dame el código paso a paso.
2. **Solo código necesario**: Si me pides editar un archivo grande, muéstrame solo la sección que cambia usando comentarios como `// ... código existente ...` para no saturar la pantalla.
3. **Manejo de Errores**: Siempre que escribas un `.subscribe()` en Angular, incluye el bloque `error: (err) => { ... }` con un `console.error` descriptivo.
4. **Idioma**: Explica todo en español.
