package LigaSync.API.controller;

import LigaSync.API.dto.LoginRequest;
import LigaSync.API.dto.RegistroRequest;
import LigaSync.API.model.Usuario;
import LigaSync.API.repository.UsuarioRepository;
import LigaSync.API.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        // 1. Buscamos si existe alguien con ese email
        Usuario usuarioDB = usuarioRepository.findByEmail(loginRequest.getEmail());

        if (usuarioDB == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado");
        }

        // 2. Comprobamos la contraseña
        // passwordEncoder.matches() coge el "123456" que te envían y mira si encaja con
        // el churro encriptado de la BD
        if (!passwordEncoder.matches(loginRequest.getPass(), usuarioDB.getPass())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Contraseña incorrecta");
        }

        // 3. Si todo está bien, fabricamos el Token JWT incluyendo el rol
        String token = jwtUtil.generateToken(usuarioDB.getEmail(), usuarioDB.getRole());

        // 4. Se lo devolvemos al usuario en un JSON bonito
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Login correcto");
        response.put("token", token);
        response.put("usuario", usuarioDB.getNombre());
        response.put("rol", usuarioDB.getRole());
        response.put("userId", usuarioDB.getId());
        response.put("jugadorId", usuarioDB.getJugadorId());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/registro")
    public ResponseEntity<?> registro(@RequestBody RegistroRequest request) {
        if (usuarioRepository.findByEmail(request.getEmail()) != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El email ya está registrado");
        }

        Usuario nuevo = new Usuario();
        nuevo.setNombre(request.getNombre());
        nuevo.setEmail(request.getEmail());
        nuevo.setPass(passwordEncoder.encode(request.getPass()));
        nuevo.setRole("espectador");

        usuarioRepository.save(nuevo);

        Map<String, String> response = new HashMap<>();
        response.put("mensaje", "Usuario registrado correctamente");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}