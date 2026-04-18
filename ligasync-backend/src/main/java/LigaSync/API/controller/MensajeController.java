package LigaSync.API.controller;

import LigaSync.API.model.Mensaje;
import LigaSync.API.model.Usuario;
import LigaSync.API.repository.MensajeRepository;
import LigaSync.API.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/mensajes")
public class MensajeController {

    @Autowired
    private MensajeRepository mensajeRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // GET /api/mensajes/conversacion?user1=1&user2=2
    // Devuelve el historial de mensajes entre dos usuarios
    @GetMapping("/conversacion")
    public List<Mensaje> obtenerConversacion(
            @RequestParam Long user1,
            @RequestParam Long user2) {
        return mensajeRepository.findConversacion(user1, user2);
    }

    // POST /api/mensajes
    // Envía un mensaje y lo guarda en la BD
    @PostMapping
    public Mensaje enviarMensaje(@RequestBody Mensaje mensaje) {
        return mensajeRepository.save(mensaje);
    }

    // GET /api/mensajes/contactos/{userId}
    // Devuelve la lista de usuarios con los que el usuario ha hablado.
    // Si nunca ha hablado con nadie, devuelve TODOS los usuarios (para iniciar conversación).
    @GetMapping("/contactos/{userId}")
    public ResponseEntity<List<Usuario>> obtenerContactos(@PathVariable Long userId) {
        List<Long> contactIds = mensajeRepository.findContactIds(userId);

        if (contactIds.isEmpty()) {
            // Sin historial: devolver lista vacía (el usuario usará el buscador para nuevos chats)
            return ResponseEntity.ok(new ArrayList<>());
        }

        // Con historial: devolver solo los usuarios con quien ha hablado
        List<Usuario> contactos = new ArrayList<>();
        for (Long cid : contactIds) {
            Optional<Usuario> u = usuarioRepository.findById(cid);
            u.ifPresent(contactos::add);
        }
        return ResponseEntity.ok(contactos);
    }

    // GET /api/mensajes/usuarios
    // Devuelve todos los usuarios (para buscar nuevos contactos)
    @GetMapping("/usuarios")
    public List<Usuario> obtenerTodosUsuarios() {
        return usuarioRepository.findAll();
    }
}
