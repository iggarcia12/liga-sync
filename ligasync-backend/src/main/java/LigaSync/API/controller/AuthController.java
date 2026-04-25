package LigaSync.API.controller;

import LigaSync.API.dto.LoginRequest;
import LigaSync.API.dto.RegistroRequest;
import LigaSync.API.model.Deporte;
import LigaSync.API.model.Liga;
import LigaSync.API.model.Usuario;
import LigaSync.API.repository.LigaRepository;
import LigaSync.API.repository.UsuarioRepository;
import LigaSync.API.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private LigaRepository ligaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Usuario usuarioDB = usuarioRepository.findByEmail(loginRequest.getEmail());

        if (usuarioDB == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado");
        }

        if (!passwordEncoder.matches(loginRequest.getPass(), usuarioDB.getPass())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Contraseña incorrecta");
        }

        String token = jwtUtil.generateToken(usuarioDB.getEmail(), usuarioDB.getRole(), usuarioDB.getLigaId());

        String deporte = ligaRepository.findById(usuarioDB.getLigaId())
                .map(l -> l.getDeporte().name())
                .orElse("FUTBOL");

        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Login correcto");
        response.put("token", token);
        response.put("usuario", usuarioDB.getNombre());
        response.put("rol", usuarioDB.getRole());
        response.put("userId", usuarioDB.getId());
        response.put("jugadorId", usuarioDB.getJugadorId());
        response.put("ligaId", usuarioDB.getLigaId());
        response.put("deporte", deporte);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/registro")
    public ResponseEntity<?> registro(@RequestBody RegistroRequest request) {
        if (usuarioRepository.findByEmail(request.getEmail()) != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El email ya está registrado");
        }

        String tipoAccion = request.getTipoAccion();
        if (tipoAccion == null || (!tipoAccion.equals("CREAR") && !tipoAccion.equals("UNIRSE"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("tipoAccion debe ser CREAR o UNIRSE");
        }

        if (request.getNombreLiga() == null || request.getNombreLiga().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El nombre de la liga es obligatorio");
        }

        Long ligaId;
        String rolAsignado;

        if ("CREAR".equals(tipoAccion)) {
            if (ligaRepository.existsByNombre(request.getNombreLiga())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Ya existe una liga con el nombre: " + request.getNombreLiga());
            }
            Liga nuevaLiga = new Liga();
            nuevaLiga.setNombre(request.getNombreLiga());
            nuevaLiga.setFechaCreacion(LocalDateTime.now());
            try {
                nuevaLiga.setDeporte(Deporte.valueOf(request.getDeporte()));
            } catch (Exception e) {
                nuevaLiga.setDeporte(Deporte.FUTBOL);
            }
            Liga ligaGuardada = ligaRepository.save(nuevaLiga);
            ligaId = ligaGuardada.getId();
            rolAsignado = "admin";

        } else { // UNIRSE
            Optional<Liga> ligaExistente = ligaRepository.findByNombre(request.getNombreLiga());
            if (ligaExistente.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No existe ninguna liga con el nombre: " + request.getNombreLiga());
            }
            ligaId = ligaExistente.get().getId();
            rolAsignado = "espectador";
        }

        Usuario nuevo = new Usuario();
        nuevo.setNombre(request.getNombre());
        nuevo.setEmail(request.getEmail());
        nuevo.setPass(passwordEncoder.encode(request.getPass()));
        nuevo.setRole(rolAsignado);
        nuevo.setLigaId(ligaId);
        usuarioRepository.save(nuevo);

        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Usuario registrado correctamente");
        response.put("rol", rolAsignado);
        response.put("ligaId", ligaId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
