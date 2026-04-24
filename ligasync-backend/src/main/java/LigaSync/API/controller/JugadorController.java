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

    @GetMapping
    public List<Jugador> obtenerJugadores() {
        return jugadorRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Jugador> obtenerPorId(@PathVariable Long id) {
        return jugadorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

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

    @GetMapping("/equipo/{equipoId}")
    public List<Jugador> obtenerPorEquipo(@PathVariable Long equipoId) {
        return jugadorRepository.findByEquipoId(equipoId);
    }

    @PostMapping
    public ResponseEntity<?> crearJugador(@RequestBody Jugador nuevoJugador) {
        if (nuevoJugador.getEquipo() != null && nuevoJugador.getEquipo().getId() != null) {
            Optional<Equipo> equipoOpt = equipoRepository.findById(nuevoJugador.getEquipo().getId());
            if (equipoOpt.isPresent()) {
                Equipo e = equipoOpt.get();
                int precio = nuevoJugador.getValor() != null ? nuevoJugador.getValor() : 0;
                
                // Validación de presupuesto al crear/fichar
                if (e.getPresupuesto() < precio) {
                    return ResponseEntity.badRequest().body("Presupuesto insuficiente para realizar el fichaje.");
                }
                e.setPresupuesto(e.getPresupuesto() - precio);
                equipoRepository.save(e);
                nuevoJugador.setEquipo(e);
            }
        }
        return ResponseEntity.ok(jugadorRepository.save(nuevoJugador));
    }

    @PutMapping("/{id}/convocatoria")
    public ResponseEntity<?> actualizarConvocatoria(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> cuerpo) {
        return jugadorRepository.findById(id).map(jugador -> {
            jugador.setConvocado(Boolean.TRUE.equals(cuerpo.get("convocado")));
            return ResponseEntity.ok(jugadorRepository.save(jugador));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/liberar")
    public ResponseEntity<?> liberarJugador(@PathVariable Long id) {
        return jugadorRepository.findById(id).map(jugador -> {
            jugador.setEquipo(null);
            jugador.setTitular(false);
            return ResponseEntity.ok(jugadorRepository.save(jugador));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/equipo/{equipoId}/titulares")
    public ResponseEntity<?> actualizarTitulares(
            @PathVariable Long equipoId,
            @RequestBody java.util.Map<String, Object> cuerpo) {

        @SuppressWarnings("unchecked")
        java.util.List<Integer> idsEnteros = (java.util.List<Integer>) cuerpo.get("titularIds");
        String formacion = (String) cuerpo.get("formacion");

        java.util.Set<Long> titularIds = idsEnteros.stream()
                .map(Integer::longValue)
                .collect(Collectors.toSet());

        List<Jugador> jugadores = jugadorRepository.findByEquipoId(equipoId);
        for (Jugador j : jugadores) {
            j.setTitular(titularIds.contains(j.getId()));
        }
        jugadorRepository.saveAll(jugadores);

        if (formacion != null && !formacion.isBlank()) {
            equipoRepository.findById(equipoId).ifPresent(e -> {
                e.setFormacion(formacion);
                equipoRepository.save(e);
            });
        }

        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarJugador(@PathVariable Long id, @RequestBody Jugador jugadorActualizado) {
        Optional<Jugador> jugadorExistenteOpt = jugadorRepository.findById(id);
        
        if (jugadorExistenteOpt.isPresent()) {
            Jugador jugadorAActualizar = jugadorExistenteOpt.get();
            
            Equipo equipoViejo = jugadorAActualizar.getEquipo();
            Equipo equipoNuevo = jugadorActualizado.getEquipo();
            
            // Lógica de compensación económica si hay cambio de equipo
            if (equipoNuevo != null && (equipoViejo == null || !equipoViejo.getId().equals(equipoNuevo.getId()))) {
                Optional<Equipo> eqNuevoOpt = equipoRepository.findById(equipoNuevo.getId());
                if (eqNuevoOpt.isPresent()) {
                    Equipo eqN = eqNuevoOpt.get();
                    int precio = jugadorAActualizar.getValor() != null ? jugadorAActualizar.getValor() : 0;
                    
                    if (eqN.getPresupuesto() < precio) {
                        return ResponseEntity.badRequest().body("Presupuesto insuficiente en el equipo destino.");
                    }
                    
                    eqN.setPresupuesto(eqN.getPresupuesto() - precio);
                    equipoRepository.save(eqN);
                    
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