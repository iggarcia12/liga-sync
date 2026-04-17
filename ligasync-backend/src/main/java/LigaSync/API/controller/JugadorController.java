package LigaSync.API.controller;

import LigaSync.API.model.Jugador;
import LigaSync.API.repository.JugadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/jugadores")
public class JugadorController {

    @Autowired
    private JugadorRepository jugadorRepository;

    // Obtener todos los jugadores
    @GetMapping
    public List<Jugador> obtenerJugadores() {
        return jugadorRepository.findAll();
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