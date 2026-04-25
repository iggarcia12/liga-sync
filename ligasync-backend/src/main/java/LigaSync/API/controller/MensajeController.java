package LigaSync.API.controller;

import LigaSync.API.model.Mensaje;
import LigaSync.API.model.Usuario;
import LigaSync.API.repository.MensajeRepository;
import LigaSync.API.repository.UsuarioRepository;
import LigaSync.API.security.SecurityUtils;
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

    @GetMapping("/conversacion")
    public List<Mensaje> obtenerConversacion(
            @RequestParam Long user1,
            @RequestParam Long user2) {
        return mensajeRepository.findConversacion(user1, user2);
    }

    @PostMapping
    public Mensaje enviarMensaje(@RequestBody Mensaje mensaje) {
        return mensajeRepository.save(mensaje);
    }

    @GetMapping("/contactos/{userId}")
    public ResponseEntity<List<Usuario>> obtenerContactos(@PathVariable Long userId) {
        List<Long> contactIds = mensajeRepository.findContactIds(userId);

        if (contactIds.isEmpty()) {
            // Si no hay historial devolvemos vacío para forzar búsqueda de nuevos chats
            return ResponseEntity.ok(new ArrayList<>());
        }

        List<Usuario> contactos = new ArrayList<>();
        for (Long cid : contactIds) {
            Optional<Usuario> u = usuarioRepository.findById(cid);
            u.ifPresent(contactos::add);
        }
        return ResponseEntity.ok(contactos);
    }

    @GetMapping("/usuarios")
    public List<Usuario> obtenerTodosUsuarios() {
        return usuarioRepository.findByLigaId(SecurityUtils.getLigaId());
    }
}
