package LigaSync.API.controller;

import LigaSync.API.model.Jugador;
import LigaSync.API.repository.JugadorRepository;
import LigaSync.API.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jugadores")
public class JugadorController {

    @Autowired
    private JugadorRepository jugadorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Obtener todos los jugadores
    @GetMapping
    public List<Jugador> obtenerJugadores() {
        return jugadorRepository.findAll();
    }

    // Obtener un jugador por ID
    @GetMapping("/{id}")
    public ResponseEntity<Jugador> obtenerPorId(@PathVariable Long id) {
        return jugadorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Obtener jugadores que aún no tienen usuario vinculado
    @GetMapping("/sin-usuario")
    public List<Jugador> obtenerSinUsuario() {
        Set<Long> usados = usuarioRepository.findAll().stream()
                .filter(u -> u.getJugadorId() != null)
                .map(u -> u.getJugadorId())
                .collect(Collectors.toSet());
        return jugadorRepository.findAll().stream()
                .filter(j -> !usados.contains(j.getId()))
                .collect(Collectors.toList());
    }

    // Obtener la plantilla de un equipo en concreto
    @GetMapping("/equipo/{equipoId}")
    public List<Jugador> obtenerPorEquipo(@PathVariable Long equipoId) {
        return jugadorRepository.findByEquipoId(equipoId);
    }

    // Fichar / Crear jugador
    @PostMapping
    public Jugador crearJugador(@RequestBody Jugador nuevoJugador) {
        return jugadorRepository.save(nuevoJugador);
    }

    // Actualizar jugador (Traspasos, Modificar media, etc)
    @PutMapping("/{id}")
    public ResponseEntity<Jugador> actualizarJugador(@PathVariable Long id, @RequestBody Jugador jugadorActualizado) {
        Optional<Jugador> jugadorExistente = jugadorRepository.findById(id);
        
        if (jugadorExistente.isPresent()) {
            Jugador jugadorAActualizar = jugadorExistente.get();
            // Actualizamos los campos
            jugadorAActualizar.setNombre(jugadorActualizado.getNombre());
            jugadorAActualizar.setPos(jugadorActualizado.getPos());
            jugadorAActualizar.setMedia(jugadorActualizado.getMedia());
            jugadorAActualizar.setEquipo(jugadorActualizado.getEquipo()); // Fundamental para el mercado
            
            Jugador guardado = jugadorRepository.save(jugadorAActualizar);
            return ResponseEntity.ok(guardado);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}