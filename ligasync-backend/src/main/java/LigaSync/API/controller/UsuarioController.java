package LigaSync.API.controller;

import LigaSync.API.model.Usuario;
import LigaSync.API.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder; // <-- Importación nueva
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // <-- Inyectamos el encriptador

    @GetMapping
    public List<Usuario> obtenerTodosLosUsuarios() {
        return usuarioRepository.findAll();
    }

    @PostMapping
    public Usuario crearUsuario(@RequestBody Usuario nuevoUsuario) {
        // ENCRIPTAR LA CONTRASEÑA
        // Cogemos la contraseña en texto plano ("123456") y la convertimos en un Hash
        // ininteligible
        String hashPassword = passwordEncoder.encode(nuevoUsuario.getPass());

        // Se la volvemos a poner al usuario antes de guardarlo
        nuevoUsuario.setPass(hashPassword);

        return usuarioRepository.save(nuevoUsuario);
    }
}