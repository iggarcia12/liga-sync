package LigaSync.API.controller;

import LigaSync.API.dto.RangoRequest;
import LigaSync.API.model.Usuario;
import LigaSync.API.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Obtener todos los usuarios
    @GetMapping
    public List<Usuario> obtenerTodosLosUsuarios() {
        return usuarioRepository.findAll();
    }

    // Obtener un usuario por ID
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerPorId(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Crear un nuevo usuario
    @PostMapping
    public Usuario crearUsuario(@RequestBody Usuario nuevoUsuario) {
        String hashPassword = passwordEncoder.encode(nuevoUsuario.getPass());
        nuevoUsuario.setPass(hashPassword);
        return usuarioRepository.save(nuevoUsuario);
    }

    // Cambiar rol y equipo de un usuario (solo admin)
    @PutMapping("/{id}/rango")
    public ResponseEntity<Usuario> cambiarRango(@PathVariable Long id, @RequestBody RangoRequest request) {
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    usuario.setRole(request.getRole());
                    usuario.setTeamId(request.getTeamId());
                    return ResponseEntity.ok(usuarioRepository.save(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Eliminar un usuario (solo admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}