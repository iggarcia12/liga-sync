package LigaSync.API.controller;

import LigaSync.API.model.Deporte;
import LigaSync.API.model.Equipo;
import LigaSync.API.model.Jugador;
import LigaSync.API.model.Liga;
import LigaSync.API.model.Oferta;
import LigaSync.API.repository.EquipoRepository;
import LigaSync.API.repository.JugadorRepository;
import LigaSync.API.repository.LigaRepository;
import LigaSync.API.repository.OfertaRepository;
import LigaSync.API.repository.PartidoRepository;
import LigaSync.API.repository.UsuarioRepository;
import LigaSync.API.security.SecurityUtils;
import LigaSync.API.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ofertas")
public class OfertaController {

    @Autowired private OfertaRepository ofertaRepository;
    @Autowired private JugadorRepository jugadorRepository;
    @Autowired private EquipoRepository equipoRepository;
    @Autowired private PartidoRepository partidoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private LigaRepository ligaRepository;
    @Autowired private EmailService emailService;

    @GetMapping("/recibidas/{equipoId}")
    public List<Oferta> ofertasRecibidas(@PathVariable Long equipoId) {
        return ofertaRepository.findByEquipoDestinoId(equipoId);
    }

    @GetMapping("/enviadas/{equipoId}")
    public List<Oferta> ofertasEnviadas(@PathVariable Long equipoId) {
        return ofertaRepository.findByEquipoOrigenId(equipoId);
    }

    @PostMapping
    public ResponseEntity<?> crearOferta(@RequestBody Oferta oferta) {
        Long ligaId = SecurityUtils.getLigaId();
        Optional<Liga> ligaOpt = ligaRepository.findById(ligaId);
        boolean esFutbol = ligaOpt.map(l -> l.getDeporte() == Deporte.FUTBOL).orElse(true);

        if (esFutbol) {
            Integer jornadaActual = partidoRepository.findJornadaActualByLiga(ligaId);
            if (jornadaActual == null || jornadaActual == 0 || jornadaActual % 3 != 0) {
                return ResponseEntity.badRequest().body("La ventana de fichajes está cerrada. Los traspasos solo se permiten en las jornadas 3, 6, 9...");
            }
        }

        Optional<Jugador> jugadorOpt = jugadorRepository.findById(oferta.getJugadorId());
        if (jugadorOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Jugador no encontrado.");
        }

        Jugador jugador = jugadorOpt.get();
        Long equipoActualId = jugador.getEquipo() != null ? jugador.getEquipo().getId() : null;

        if (!oferta.getEquipoDestinoId().equals(equipoActualId)) {
            return ResponseEntity.badRequest().body("El equipo destino no coincide con el equipo actual del jugador.");
        }

        Optional<Equipo> origenOpt = equipoRepository.findById(oferta.getEquipoOrigenId());
        if (origenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Equipo origen no encontrado.");
        }
        if (origenOpt.get().getPresupuesto() < oferta.getMonto()) {
            return ResponseEntity.badRequest().body("El equipo no tiene presupuesto suficiente para hacer esta oferta.");
        }

        oferta.setEstado(Oferta.Estado.PENDIENTE);
        Oferta ofertaGuardada = ofertaRepository.save(oferta);

        // Notificación async al entrenador del equipo vendedor (no bloquea la respuesta HTTP)
        var entrenadorOpt = usuarioRepository.findByTeamIdAndRole(oferta.getEquipoDestinoId().intValue(), "entrenador");
        if (entrenadorOpt.isEmpty()) {
            System.err.println("[OfertaController] No se encontró entrenador para equipo ID=" + oferta.getEquipoDestinoId() + " con role='entrenador'");
        } else {
            System.out.println("[OfertaController] Enviando email a: " + entrenadorOpt.get().getEmail());
            emailService.enviarNotificacionOferta(
                entrenadorOpt.get().getEmail(),
                jugador.getNombre(),
                origenOpt.get().getNombre(),
                oferta.getMonto().doubleValue()
            );
        }

        return ResponseEntity.ok(ofertaGuardada);
    }

    @PutMapping("/{id}/aceptar")
    public ResponseEntity<?> aceptarOferta(@PathVariable Long id) {
        Optional<Oferta> ofertaOpt = ofertaRepository.findById(id);
        if (ofertaOpt.isEmpty()) return ResponseEntity.notFound().build();

        Oferta oferta = ofertaOpt.get();
        if (oferta.getEstado() != Oferta.Estado.PENDIENTE) {
            return ResponseEntity.badRequest().body("La oferta ya no está pendiente.");
        }

        Optional<Jugador> jugadorOpt = jugadorRepository.findById(oferta.getJugadorId());
        Optional<Equipo> origenOpt = equipoRepository.findById(oferta.getEquipoOrigenId());
        Optional<Equipo> destinoOpt = equipoRepository.findById(oferta.getEquipoDestinoId());

        if (jugadorOpt.isEmpty() || origenOpt.isEmpty() || destinoOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Datos de la oferta incompletos o inválidos.");
        }

        Equipo origen = origenOpt.get();
        Equipo destino = destinoOpt.get();

        if (origen.getPresupuesto() < oferta.getMonto()) {
            return ResponseEntity.badRequest().body("El equipo comprador ya no tiene presupuesto suficiente.");
        }

        // Transacción económica entre clubes
        origen.setPresupuesto(origen.getPresupuesto() - oferta.getMonto());
        destino.setPresupuesto(destino.getPresupuesto() + oferta.getMonto());
        equipoRepository.save(origen);
        equipoRepository.save(destino);

        // Cambio de equipo y estado del jugador
        Jugador jugador = jugadorOpt.get();
        jugador.setEquipo(origen);
        jugador.setTitular(false);
        jugadorRepository.save(jugador);

        oferta.setEstado(Oferta.Estado.ACEPTADA);
        ofertaRepository.save(oferta);

        // Rechazo automático de otras ofertas por el mismo jugador
        List<Oferta> pendientes = ofertaRepository.findByJugadorIdAndEstado(
                oferta.getJugadorId(), Oferta.Estado.PENDIENTE);
        for (Oferta otra : pendientes) {
            otra.setEstado(Oferta.Estado.RECHAZADA);
            ofertaRepository.save(otra);
        }

        return ResponseEntity.ok(jugador);
    }

    @PutMapping("/{id}/rechazar")
    public ResponseEntity<?> rechazarOferta(@PathVariable Long id) {
        Optional<Oferta> ofertaOpt = ofertaRepository.findById(id);
        if (ofertaOpt.isEmpty()) return ResponseEntity.notFound().build();

        Oferta oferta = ofertaOpt.get();
        if (oferta.getEstado() != Oferta.Estado.PENDIENTE) {
            return ResponseEntity.badRequest().body("La oferta ya no está pendiente.");
        }

        oferta.setEstado(Oferta.Estado.RECHAZADA);
        return ResponseEntity.ok(ofertaRepository.save(oferta));
    }
}
