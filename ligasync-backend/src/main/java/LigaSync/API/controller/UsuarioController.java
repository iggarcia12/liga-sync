package LigaSync.API.controller;

import LigaSync.API.dto.RangoRequest;
import LigaSync.API.model.Usuario;
import LigaSync.API.repository.UsuarioRepository;
import LigaSync.API.security.SecurityUtils;
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

    @GetMapping
    public List<Usuario> obtenerTodosLosUsuarios() {
        return usuarioRepository.findByLigaId(SecurityUtils.getLigaId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerPorId(@PathVariable Long id) {
        Long ligaId = SecurityUtils.getLigaId();
        return usuarioRepository.findById(id)
                .filter(u -> ligaId.equals(u.getLigaId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Usuario crearUsuario(@RequestBody Usuario nuevoUsuario) {
        nuevoUsuario.setLigaId(SecurityUtils.getLigaId());
        nuevoUsuario.setPass(passwordEncoder.encode(nuevoUsuario.getPass()));
        return usuarioRepository.save(nuevoUsuario);
    }

    @PutMapping("/{id}/rango")
    public ResponseEntity<Usuario> cambiarRango(@PathVariable Long id, @RequestBody RangoRequest request) {
        Long ligaId = SecurityUtils.getLigaId();
        return usuarioRepository.findById(id)
                .filter(u -> ligaId.equals(u.getLigaId()))
                .map(usuario -> {
                    usuario.setRole(request.getRole());
                    usuario.setTeamId(request.getTeamId());
                    usuario.setJugadorId(request.getJugadorId());
                    return ResponseEntity.ok(usuarioRepository.save(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        Long ligaId = SecurityUtils.getLigaId();
        return usuarioRepository.findById(id)
                .filter(u -> ligaId.equals(u.getLigaId()))
                .map(u -> {
                    usuarioRepository.delete(u);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
