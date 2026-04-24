package LigaSync.API.controller;

import LigaSync.API.model.Partido;
import LigaSync.API.model.Noticia;
import LigaSync.API.model.Equipo;
import LigaSync.API.model.Jugador;
import LigaSync.API.dto.MatchResultRequest;
import LigaSync.API.dto.FirmarActaRequest;
import LigaSync.API.repository.PartidoRepository;
import LigaSync.API.repository.NoticiaRepository;
import LigaSync.API.repository.EquipoRepository;
import LigaSync.API.repository.JugadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/partidos")
public class PartidoController {

    @Autowired
    private PartidoRepository partidoRepository;

    @Autowired
    private NoticiaRepository noticiaRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private JugadorRepository jugadorRepository;

    @GetMapping
    public List<Partido> obtenerPartidos() {
        return partidoRepository.findAll();
    }

    @GetMapping("/jornada/{numJornada}")
    public List<Partido> obtenerPorJornada(@PathVariable Integer numJornada) {
        return partidoRepository.findByJornada(numJornada);
    }

    @GetMapping("/jornada-actual")
    public ResponseEntity<Integer> obtenerJornadaActual() {
        Integer jornada = partidoRepository.findJornadaActual();
        return ResponseEntity.ok(jornada != null ? jornada : 0);
    }

    @PostMapping
    public Partido registrarPartido(@RequestBody Partido partido) {
        return partidoRepository.save(partido);
    }

    @PostMapping("/generar-calendario")
    public ResponseEntity<List<Partido>> generarCalendario() {
        List<Equipo> equipos = equipoRepository.findAll();
        if (equipos.size() < 2) {
            return ResponseEntity.badRequest().build();
        }

        partidoRepository.deleteAll();

        List<Partido> partidosGenerados = new ArrayList<>();
        int numEquipos = equipos.size();
        boolean esImpar = (numEquipos % 2 != 0);

        if (esImpar) {
            // El truco del equipo "fantasma" para que cuadren las jornadas en ligas impares
            numEquipos++; 
        }

        int jornadas = numEquipos - 1;
        int partidosPorJornada = numEquipos / 2;

        for (int j = 0; j < jornadas; j++) {
            for (int p = 0; p < partidosPorJornada; p++) {
                int localIdx = (j + p) % (numEquipos - 1);
                int visitanteIdx = (j + numEquipos - 1 - p) % (numEquipos - 1);

                if (p == 0) {
                    visitanteIdx = numEquipos - 1;
                }

                if ((!esImpar) || (localIdx < equipos.size() && visitanteIdx < equipos.size())) {
                    Equipo local = equipos.get(localIdx);
                    Equipo visitante = equipos.get(visitanteIdx);

                    Partido ida = new Partido();
                    ida.setLocal(local);
                    ida.setVisitante(visitante);
                    ida.setJornada(j + 1);
                    ida.setFecha(LocalDate.now().plusDays(j * 7).toString());
                    partidosGenerados.add(ida);

                    // Generamos ida y vuelta del tirón para tener la liga completa
                    Partido vuelta = new Partido();
                    vuelta.setLocal(visitante);
                    vuelta.setVisitante(local);
                    vuelta.setJornada(j + 1 + jornadas);
                    vuelta.setFecha(LocalDate.now().plusDays((j + jornadas) * 7).toString());
                    partidosGenerados.add(vuelta);
                }
            }
        }

        return ResponseEntity.ok(partidoRepository.saveAll(partidosGenerados));
    }

    @PutMapping("/{id}/resultado")
    public ResponseEntity<Partido> actualizarResultado(@PathVariable Long id, @RequestBody MatchResultRequest request) {
        Optional<Partido> partidoOpt = partidoRepository.findById(id);
        if (partidoOpt.isEmpty())
            return ResponseEntity.notFound().build();

        Partido partido = partidoOpt.get();
        partido.setGolesLocal(request.getGolesLocal());
        partido.setGolesVisitante(request.getGolesVisitante());

        StringBuilder resumenGoleadores = new StringBuilder();
        if (request.getIncidencias() != null) {
            for (MatchResultRequest.IncidenciaDTO inc : request.getIncidencias()) {
                Optional<Jugador> jugOpt = jugadorRepository.findById(inc.getJugadorId());
                if (jugOpt.isPresent()) {
                    Jugador j = jugOpt.get();
                    switch (inc.getTipo().toUpperCase()) {
                        case "GOL":
                            j.setGoles((j.getGoles() != null ? j.getGoles() : 0) + 1);
                            resumenGoleadores.append(j.getNombre()).append(" (gol), ");
                            break;
                        case "ASIST":
                            j.setAsist((j.getAsist() != null ? j.getAsist() : 0) + 1);
                            break;
                        case "AMARILLA":
                            j.setAmarillas((j.getAmarillas() != null ? j.getAmarillas() : 0) + 1);
                            if (j.getEquipo() != null) {
                                double deuda = j.getEquipo().getDeudaAcumulada() != null ? j.getEquipo().getDeudaAcumulada() : 0.0;
                                j.getEquipo().setDeudaAcumulada(deuda + MULTA_AMARILLA);
                                equipoRepository.save(j.getEquipo());
                            }
                            break;
                        case "ROJA":
                            j.setRojas((j.getRojas() != null ? j.getRojas() : 0) + 1);
                            if (j.getEquipo() != null) {
                                double deuda = j.getEquipo().getDeudaAcumulada() != null ? j.getEquipo().getDeudaAcumulada() : 0.0;
                                j.getEquipo().setDeudaAcumulada(deuda + MULTA_ROJA);
                                equipoRepository.save(j.getEquipo());
                            }
                            break;
                    }
                    jugadorRepository.save(j);
                }
            }
        }

        if (resumenGoleadores.length() > 2) {
            // Limpieza de la última coma del acumulado
            partido.setGoleadores(resumenGoleadores.substring(0, resumenGoleadores.length() - 2));
        }

        // Al meter el resultado, recalculamos stats de los dos equipos
        Equipo local = partido.getLocal();
        Equipo visitante = partido.getVisitante();
        int gL = request.getGolesLocal() != null ? request.getGolesLocal() : 0;
        int gV = request.getGolesVisitante() != null ? request.getGolesVisitante() : 0;

        if (local != null) {
            local.setPj((local.getPj() != null ? local.getPj() : 0) + 1);
            local.setGf((local.getGf() != null ? local.getGf() : 0) + gL);
            local.setGc((local.getGc() != null ? local.getGc() : 0) + gV);
            if (gL > gV) {
                local.setPg((local.getPg() != null ? local.getPg() : 0) + 1);
                local.setPts((local.getPts() != null ? local.getPts() : 0) + 3);
            } else if (gL == gV) {
                local.setPe((local.getPe() != null ? local.getPe() : 0) + 1);
                local.setPts((local.getPts() != null ? local.getPts() : 0) + 1);
            } else {
                local.setPp((local.getPp() != null ? local.getPp() : 0) + 1);
            }
            equipoRepository.save(local);
        }
        if (visitante != null) {
            visitante.setPj((visitante.getPj() != null ? visitante.getPj() : 0) + 1);
            visitante.setGf((visitante.getGf() != null ? visitante.getGf() : 0) + gV);
            visitante.setGc((visitante.getGc() != null ? visitante.getGc() : 0) + gL);
            if (gV > gL) {
                visitante.setPg((visitante.getPg() != null ? visitante.getPg() : 0) + 1);
                visitante.setPts((visitante.getPts() != null ? visitante.getPts() : 0) + 3);
            } else if (gV == gL) {
                visitante.setPe((visitante.getPe() != null ? visitante.getPe() : 0) + 1);
                visitante.setPts((visitante.getPts() != null ? visitante.getPts() : 0) + 1);
            } else {
                visitante.setPp((visitante.getPp() != null ? visitante.getPp() : 0) + 1);
            }
            equipoRepository.save(visitante);
        }

        Partido guardado = partidoRepository.save(partido);

        String nombreLocal = guardado.getLocal() != null ? guardado.getLocal().getNombre() : "Equipo Local";
        String nombreVisitante = guardado.getVisitante() != null ? guardado.getVisitante().getNombre()
                : "Equipo Visitante";

        String titulo = "Resultado: " + nombreLocal + " " + guardado.getGolesLocal() + " - "
                + guardado.getGolesVisitante() + " " + nombreVisitante;
        String contenido = "Jornada " + guardado.getJornada() + ". Final del partido en " + nombreLocal + ". " +
                titulo + (guardado.getGoleadores() != null ? ". Goles: " + guardado.getGoleadores() : "");

        Noticia noticia = new Noticia();
        noticia.setTitulo(titulo);
        noticia.setContenido(contenido);
        noticia.setFecha(LocalDate.now().toString());
        noticiaRepository.save(noticia);

        return ResponseEntity.ok(guardado);
    }

    private static final double MULTA_AMARILLA = 500_000.0;
    private static final double MULTA_ROJA = 1_000_000.0;
    private static final int AMARILLAS_PARA_SANCION = 3;

    @PutMapping("/{id}/firmar")
    public ResponseEntity<?> firmarActa(@PathVariable Long id, @RequestBody FirmarActaRequest request) {
        Optional<Partido> partidoOpt = partidoRepository.findById(id);
        if (partidoOpt.isEmpty())
            return ResponseEntity.notFound().build();

        Partido partido = partidoOpt.get();

        if (partido.getEstado() == Partido.EstadoPartido.FINALIZADO_Y_FIRMADO)
            return ResponseEntity.badRequest().body("El acta de este partido ya ha sido firmada y no puede modificarse.");

        partido.setGolesLocal(request.getGolesLocal());
        partido.setGolesVisitante(request.getGolesVisitante());
        partido.setMvpId(request.getMvpId());

        StringBuilder resumenGoleadores = new StringBuilder();

        if (request.getIncidencias() != null) {
            for (FirmarActaRequest.IncidenciaDTO inc : request.getIncidencias()) {
                Optional<Jugador> jugOpt = jugadorRepository.findById(inc.getJugadorId());
                if (jugOpt.isEmpty()) continue;

                Jugador jugador = jugOpt.get();
                Equipo equipo = jugador.getEquipo();

                switch (inc.getTipo().toUpperCase()) {
                    case "GOL":
                        jugador.setGoles((jugador.getGoles() != null ? jugador.getGoles() : 0) + 1);
                        resumenGoleadores.append(jugador.getNombre()).append(" (gol), ");
                        break;
                    case "ASIST":
                        jugador.setAsist((jugador.getAsist() != null ? jugador.getAsist() : 0) + 1);
                        break;
                    case "AMARILLA":
                        jugador.setAmarillas((jugador.getAmarillas() != null ? jugador.getAmarillas() : 0) + 1);
                        int acumuladas = (jugador.getTarjetasAmarillasAcumuladas() != null ? jugador.getTarjetasAmarillasAcumuladas() : 0) + 1;
                        jugador.setTarjetasAmarillasAcumuladas(acumuladas);
                        if (acumuladas >= AMARILLAS_PARA_SANCION) {
                            jugador.setEstadoDisciplinario(Jugador.EstadoDisciplinario.SANCIONADO);
                            jugador.setTarjetasAmarillasAcumuladas(0);
                        }
                        if (equipo != null) {
                            double deuda = equipo.getDeudaAcumulada() != null ? equipo.getDeudaAcumulada() : 0.0;
                            equipo.setDeudaAcumulada(deuda + MULTA_AMARILLA);
                        }
                        break;
                    case "ROJA":
                        jugador.setRojas((jugador.getRojas() != null ? jugador.getRojas() : 0) + 1);
                        jugador.setEstadoDisciplinario(Jugador.EstadoDisciplinario.SANCIONADO);
                        if (equipo != null) {
                            double deuda = equipo.getDeudaAcumulada() != null ? equipo.getDeudaAcumulada() : 0.0;
                            equipo.setDeudaAcumulada(deuda + MULTA_ROJA);
                        }
                        break;
                }

                if (equipo != null) equipoRepository.save(equipo);
                jugadorRepository.save(jugador);
            }
        }

        if (resumenGoleadores.length() > 2)
            partido.setGoleadores(resumenGoleadores.substring(0, resumenGoleadores.length() - 2));

        // Actualizar estadísticas de la liga
        Equipo local = partido.getLocal();
        Equipo visitante = partido.getVisitante();
        int gL = request.getGolesLocal() != null ? request.getGolesLocal() : 0;
        int gV = request.getGolesVisitante() != null ? request.getGolesVisitante() : 0;

        if (local != null) {
            local.setPj((local.getPj() != null ? local.getPj() : 0) + 1);
            local.setGf((local.getGf() != null ? local.getGf() : 0) + gL);
            local.setGc((local.getGc() != null ? local.getGc() : 0) + gV);
            if (gL > gV) {
                local.setPg((local.getPg() != null ? local.getPg() : 0) + 1);
                local.setPts((local.getPts() != null ? local.getPts() : 0) + 3);
            } else if (gL == gV) {
                local.setPe((local.getPe() != null ? local.getPe() : 0) + 1);
                local.setPts((local.getPts() != null ? local.getPts() : 0) + 1);
            } else {
                local.setPp((local.getPp() != null ? local.getPp() : 0) + 1);
            }
            equipoRepository.save(local);
        }

        if (visitante != null) {
            visitante.setPj((visitante.getPj() != null ? visitante.getPj() : 0) + 1);
            visitante.setGf((visitante.getGf() != null ? visitante.getGf() : 0) + gV);
            visitante.setGc((visitante.getGc() != null ? visitante.getGc() : 0) + gL);
            if (gV > gL) {
                visitante.setPg((visitante.getPg() != null ? visitante.getPg() : 0) + 1);
                visitante.setPts((visitante.getPts() != null ? visitante.getPts() : 0) + 3);
            } else if (gV == gL) {
                visitante.setPe((visitante.getPe() != null ? visitante.getPe() : 0) + 1);
                visitante.setPts((visitante.getPts() != null ? visitante.getPts() : 0) + 1);
            } else {
                visitante.setPp((visitante.getPp() != null ? visitante.getPp() : 0) + 1);
            }
            equipoRepository.save(visitante);
        }

        partido.setEstado(Partido.EstadoPartido.FINALIZADO_Y_FIRMADO);
        Partido guardado = partidoRepository.save(partido);

        String nombreLocal = guardado.getLocal() != null ? guardado.getLocal().getNombre() : "Local";
        String nombreVisitante = guardado.getVisitante() != null ? guardado.getVisitante().getNombre() : "Visitante";
        String titulo = "Acta firmada: " + nombreLocal + " " + gL + " - " + gV + " " + nombreVisitante;
        String contenido = "Jornada " + guardado.getJornada() + ". " + titulo +
                (guardado.getGoleadores() != null ? ". Goles: " + guardado.getGoleadores() : "");

        Noticia noticia = new Noticia();
        noticia.setTitulo(titulo);
        noticia.setContenido(contenido);
        noticia.setFecha(java.time.LocalDate.now().toString());
        noticiaRepository.save(noticia);

        return ResponseEntity.ok(guardado);
    }

    @DeleteMapping("/{id}")
    public void eliminarPartido(@PathVariable Long id) {
        partidoRepository.deleteById(id);
    }
}