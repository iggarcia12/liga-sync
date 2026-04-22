package LigaSync.API.controller;

import LigaSync.API.model.Jugador;
import LigaSync.API.model.Equipo;
import LigaSync.API.repository.JugadorRepository;
import LigaSync.API.repository.UsuarioRepository;
import LigaSync.API.repository.EquipoRepository;
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

    @Autowired
    private EquipoRepository equipoRepository;

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
    public ResponseEntity<?> crearJugador(@RequestBody Jugador nuevoJugador) {
        if (nuevoJugador.getEquipo() != null && nuevoJugador.getEquipo().getId() != null) {
            Optional<Equipo> equipoOpt = equipoRepository.findById(nuevoJugador.getEquipo().getId());
            if (equipoOpt.isPresent()) {
                Equipo e = equipoOpt.get();
                int precio = nuevoJugador.getValor() != null ? nuevoJugador.getValor() : 0;
                if (e.getPresupuesto() < precio) {
                    return ResponseEntity.badRequest().body("Presupuesto insuficiente para realizar el fichaje.");
                }
                e.setPresupuesto(e.getPresupuesto() - precio);
                equipoRepository.save(e);
                // Aseguramos que se guarde el objeto completo del equipo
                nuevoJugador.setEquipo(e);
            }
        }
        return ResponseEntity.ok(jugadorRepository.save(nuevoJugador));
    }

    // Actualizar jugador (Traspasos, Modificar media, etc)
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarJugador(@PathVariable Long id, @RequestBody Jugador jugadorActualizado) {
        Optional<Jugador> jugadorExistenteOpt = jugadorRepository.findById(id);
        
        if (jugadorExistenteOpt.isPresent()) {
            Jugador jugadorAActualizar = jugadorExistenteOpt.get();
            
            // Lógica de presupuesto para traspasos
            Equipo equipoViejo = jugadorAActualizar.getEquipo();
            Equipo equipoNuevo = jugadorActualizado.getEquipo();
            
            // Si el equipo ha cambiado
            if (equipoNuevo != null && (equipoViejo == null || !equipoViejo.getId().equals(equipoNuevo.getId()))) {
                Optional<Equipo> eqNuevoOpt = equipoRepository.findById(equipoNuevo.getId());
                if (eqNuevoOpt.isPresent()) {
                    Equipo eqN = eqNuevoOpt.get();
                    int precio = jugadorAActualizar.getValor() != null ? jugadorAActualizar.getValor() : 0;
                    
                    if (eqN.getPresupuesto() < precio) {
                        return ResponseEntity.badRequest().body("Presupuesto insuficiente en el equipo destino.");
                    }
                    
                    // Restar al nuevo
                    eqN.setPresupuesto(eqN.getPresupuesto() - precio);
                    equipoRepository.save(eqN);
                    
                    // Sumar al viejo (si existía)
                    if (equipoViejo != null) {
                        Optional<Equipo> eqViejoOpt = equipoRepository.findById(equipoViejo.getId());
                        if (eqViejoOpt.isPresent()) {
                            Equipo eqV = eqViejoOpt.get();
                            eqV.setPresupuesto(eqV.getPresupuesto() + precio);
                            equipoRepository.save(eqV);
                        }
                    }
                }
            }

            // Actualizamos los campos
            jugadorAActualizar.setNombre(jugadorActualizado.getNombre());
            jugadorAActualizar.setPos(jugadorActualizado.getPos());
            jugadorAActualizar.setMedia(jugadorActualizado.getMedia());
            jugadorAActualizar.setValor(jugadorActualizado.getValor());
            jugadorAActualizar.setEquipo(jugadorActualizado.getEquipo());
            
            Jugador guardado = jugadorRepository.save(jugadorAActualizar);
            return ResponseEntity.ok(guardado);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}