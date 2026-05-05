package LigaSync.API.service;

import LigaSync.API.model.Deporte;
import LigaSync.API.model.Liga;
import LigaSync.API.model.Usuario;
import LigaSync.API.repository.LigaRepository;
import LigaSync.API.repository.UsuarioRepository;
import LigaSync.API.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final String GOOGLE_CLIENT_ID =
        "376016123168-3imb1gjhio93hvluq74b7scf52jpvbf9.apps.googleusercontent.com";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private LigaRepository ligaRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Map<String, Object> loginWithGoogle(String googleToken) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(GOOGLE_CLIENT_ID))
                .build();

        GoogleIdToken idToken = verifier.verify(googleToken);
        if (idToken == null) {
            throw new SecurityException("Token de Google inválido o expirado.");
        }

        Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String nombre = (String) payload.get("name");

        Usuario usuario = usuarioRepository.findByEmail(email);

        if (usuario == null) {
            usuario = new Usuario();
            usuario.setNombre(nombre != null ? nombre : email);
            usuario.setEmail(email);
            usuario.setPass(passwordEncoder.encode(UUID.randomUUID().toString()));
            usuario.setRole("espectador");
            usuarioRepository.save(usuario);
        }

        String jwtToken = jwtUtil.generateToken(
            usuario.getEmail(),
            usuario.getRole(),
            usuario.getLigaId()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtToken);
        response.put("rol", usuario.getRole());
        response.put("usuario", usuario.getNombre());
        response.put("userId", usuario.getId());
        response.put("jugadorId", usuario.getJugadorId());
        response.put("ligaId", usuario.getLigaId());
        response.put("deporte", "FUTBOL");
        response.put("needsLiga", usuario.getLigaId() == null);
        return response;
    }

    public Map<String, Object> asignarLiga(String email, String tipoAccion, String nombreLiga, String deporte) {
        Usuario usuario = usuarioRepository.findByEmail(email);
        if (usuario == null) {
            throw new RuntimeException("Usuario no encontrado.");
        }

        Long ligaId;
        String rolAsignado;

        if ("CREAR".equals(tipoAccion)) {
            if (ligaRepository.existsByNombre(nombreLiga)) {
                throw new IllegalArgumentException("Ya existe una liga con el nombre: " + nombreLiga);
            }
            Liga nuevaLiga = new Liga();
            nuevaLiga.setNombre(nombreLiga);
            nuevaLiga.setFechaCreacion(LocalDateTime.now());
            try {
                nuevaLiga.setDeporte(Deporte.valueOf(deporte));
            } catch (Exception e) {
                nuevaLiga.setDeporte(Deporte.FUTBOL);
            }
            Liga ligaGuardada = ligaRepository.save(nuevaLiga);
            ligaId = ligaGuardada.getId();
            rolAsignado = "admin";
        } else {
            Optional<Liga> ligaExistente = ligaRepository.findByNombre(nombreLiga);
            if (ligaExistente.isEmpty()) {
                throw new NoSuchElementException("No existe ninguna liga con el nombre: " + nombreLiga);
            }
            ligaId = ligaExistente.get().getId();
            rolAsignado = "espectador";
        }

        usuario.setLigaId(ligaId);
        usuario.setRole(rolAsignado);
        usuarioRepository.save(usuario);

        String jwtToken = jwtUtil.generateToken(usuario.getEmail(), rolAsignado, ligaId);

        String deporteStr = ligaRepository.findById(ligaId)
            .map(l -> l.getDeporte().name())
            .orElse("FUTBOL");

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtToken);
        response.put("rol", rolAsignado);
        response.put("usuario", usuario.getNombre());
        response.put("userId", usuario.getId());
        response.put("jugadorId", usuario.getJugadorId());
        response.put("ligaId", ligaId);
        response.put("deporte", deporteStr);
        return response;
    }
}
