package LigaSync.API.controller;

import LigaSync.API.model.Partido;
import LigaSync.API.model.Noticia;
import LigaSync.API.model.Equipo;
import LigaSync.API.model.Jugador;
import LigaSync.API.model.Deporte;
import LigaSync.API.dto.MatchResultRequest;
import LigaSync.API.dto.FirmarActaRequest;
import LigaSync.API.repository.PartidoRepository;
import LigaSync.API.repository.NoticiaRepository;
import LigaSync.API.repository.EquipoRepository;
import LigaSync.API.repository.JugadorRepository;
import LigaSync.API.repository.LigaRepository;
import LigaSync.API.service.PdfService;
import LigaSync.API.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    @Autowired
    private LigaRepository ligaRepository;
    @Autowired
    private PdfService pdfService;

    private static final double MULTA_AMARILLA = 500_000.0;
    private static final double MULTA_ROJA = 1_000_000.0;
    private static final int AMARILLAS_PARA_SANCION = 3;

    @GetMapping
    public List<Partido> obtenerPartidos() {
        return partidoRepository.findByLigaId(SecurityUtils.getLigaId());
    }

    @GetMapping("/jornada/{numJornada}")
    public List<Partido> obtenerPorJornada(@PathVariable Integer numJornada) {
        return partidoRepository.findByJornadaAndLigaId(numJornada, SecurityUtils.getLigaId());
    }

    @GetMapping("/jornada-actual")
    public ResponseEntity<Integer> obtenerJornadaActual() {
        Integer jornada = partidoRepository.findJornadaActualByLiga(SecurityUtils.getLigaId());
        return ResponseEntity.ok(jornada != null ? jornada : 0);
    }

    @PostMapping
    public Partido registrarPartido(@RequestBody Partido partido) {
        partido.setLigaId(SecurityUtils.getLigaId());
        return partidoRepository.save(partido);
    }

    @PostMapping("/generar-calendario")
    public ResponseEntity<List<Partido>> generarCalendario() {
        Long ligaId = SecurityUtils.getLigaId();
        List<Equipo> equipos = equipoRepository.findByLigaId(ligaId);
        if (equipos.size() < 2)
            return ResponseEntity.badRequest().build();

        partidoRepository.deleteAll(partidoRepository.findByLigaId(ligaId));

        List<Jugador> jugadores = jugadorRepository.findByEquipo_LigaId(ligaId);
        for (Jugador j : jugadores) {
            j.setGoles(0);
            j.setAsist(0);
            j.setRebotes(0);
            j.setTriples(0);
            j.setAmarillas(0);
            j.setRojas(0);
            j.setTarjetasAmarillasAcumuladas(0);
            j.setEstadoDisciplinario(Jugador.EstadoDisciplinario.DISPONIBLE);
        }
        jugadorRepository.saveAll(jugadores);

        for (Equipo e : equipos) {
            e.setPts(0);
            e.setPj(0);
            e.setPg(0);
            e.setPe(0);
            e.setPp(0);
            e.setGf(0);
            e.setGc(0);
            e.setDeudaAcumulada(0.0);
        }
        equipoRepository.saveAll(equipos);

        List<Partido> partidosGenerados = new ArrayList<>();
        int numEquipos = equipos.size();
        boolean esImpar = (numEquipos % 2 != 0);
        if (esImpar)
            numEquipos++; // Equipo virtual para que el round-robin funcione con número impar

        int jornadas = numEquipos - 1;
        int partidosPorJornada = numEquipos / 2;

        // Algoritmo de rotación circular: el último equipo es fijo, el resto rota
        // jornada a jornada
        for (int j = 0; j < jornadas; j++) {
            for (int p = 0; p < partidosPorJornada; p++) {
                int localIdx = (j + p) % (numEquipos - 1);
                int visitanteIdx = (j + numEquipos - 1 - p) % (numEquipos - 1);
                if (p == 0)
                    visitanteIdx = numEquipos - 1;

                if (!esImpar || (localIdx < equipos.size() && visitanteIdx < equipos.size())) {
                    Equipo local = equipos.get(localIdx);
                    Equipo visitante = equipos.get(visitanteIdx);

                    Partido ida = new Partido();
                    ida.setLocal(local);
                    ida.setVisitante(visitante);
                    ida.setJornada(j + 1);
                    ida.setFecha(LocalDate.now().plusDays(j * 7).toString());
                    ida.setLigaId(ligaId);
                    partidosGenerados.add(ida);

                    Partido vuelta = new Partido();
                    vuelta.setLocal(visitante);
                    vuelta.setVisitante(local);
                    vuelta.setJornada(j + 1 + jornadas);
                    vuelta.setFecha(LocalDate.now().plusDays((j + jornadas) * 7).toString());
                    vuelta.setLigaId(ligaId);
                    partidosGenerados.add(vuelta);
                }
            }
        }

        return ResponseEntity.ok(partidoRepository.saveAll(partidosGenerados));
    }

    @PutMapping("/{id}/resultado")
    public ResponseEntity<Partido> actualizarResultado(@PathVariable Long id, @RequestBody MatchResultRequest request) {
        Long ligaId = SecurityUtils.getLigaId();
        Optional<Partido> partidoOpt = partidoRepository.findById(id);
        if (partidoOpt.isEmpty() || !ligaId.equals(partidoOpt.get().getLigaId()))
            return ResponseEntity.notFound().build();

        boolean esBasket = esLigaDeBaloncesto(ligaId);
        Partido partido = partidoOpt.get();
        partido.setGolesLocal(request.getGolesLocal());
        partido.setGolesVisitante(request.getGolesVisitante());

        StringBuilder resumen = new StringBuilder();
        if (request.getIncidencias() != null) {
            for (MatchResultRequest.IncidenciaDTO inc : request.getIncidencias()) {
                Optional<Jugador> jugOpt = jugadorRepository.findById(inc.getJugadorId());
                if (jugOpt.isEmpty())
                    continue;
                Jugador j = jugOpt.get();
                procesarIncidencia(j, inc.getTipo(), inc.getValorAnotacion(), resumen, esBasket);
                jugadorRepository.save(j);
            }
        }

        if (resumen.length() > 1)
            partido.setGoleadores(resumen.substring(0, resumen.length() - 1));

        int gL = safe(request.getGolesLocal());
        int gV = safe(request.getGolesVisitante());

        if (partido.getLocal() != null) {
            actualizarClasificacion(partido.getLocal(), gL, gV, esBasket);
            equipoRepository.save(partido.getLocal());
        }
        if (partido.getVisitante() != null) {
            actualizarClasificacion(partido.getVisitante(), gV, gL, esBasket);
            equipoRepository.save(partido.getVisitante());
        }

        Partido guardado = partidoRepository.save(partido);
        publicarNoticia(guardado, ligaId, esBasket);
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}/firmar")
    public ResponseEntity<?> firmarActa(@PathVariable Long id, @RequestBody FirmarActaRequest request) {
        Long ligaId = SecurityUtils.getLigaId();
        Optional<Partido> partidoOpt = partidoRepository.findById(id);
        if (partidoOpt.isEmpty() || !ligaId.equals(partidoOpt.get().getLigaId()))
            return ResponseEntity.notFound().build();

        Partido partido = partidoOpt.get();
        if (partido.getEstado() == Partido.EstadoPartido.FINALIZADO_Y_FIRMADO)
            return ResponseEntity.badRequest()
                    .body("El acta de este partido ya ha sido firmada y no puede modificarse.");

        boolean esBasket = esLigaDeBaloncesto(ligaId);
        int gL = safe(request.getGolesLocal());
        int gV = safe(request.getGolesVisitante());

        // En baloncesto nunca hay empate; en playoffs tampoco
        boolean esPlayoff = partido.getTipoPartido() != null && partido.getTipoPartido() != Partido.TipoPartido.REGULAR;
        if ((esBasket || esPlayoff) && gL == gV)
            return ResponseEntity.badRequest().body(
                    esBasket ? "En baloncesto no puede haber empate." : "En los play-offs no puede haber empate.");

        partido.setGolesLocal(request.getGolesLocal());
        partido.setGolesVisitante(request.getGolesVisitante());
        partido.setMvpId(request.getMvpId());

        StringBuilder resumen = new StringBuilder();
        if (request.getIncidencias() != null) {
            for (FirmarActaRequest.IncidenciaDTO inc : request.getIncidencias()) {
                Optional<Jugador> jugOpt = jugadorRepository.findById(inc.getJugadorId());
                if (jugOpt.isEmpty())
                    continue;
                Jugador jugador = jugOpt.get();
                procesarIncidenciaFirma(jugador, inc.getTipo(), inc.getValorAnotacion(), resumen, esBasket);
                if (jugador.getEquipo() != null)
                    equipoRepository.save(jugador.getEquipo());
                jugadorRepository.save(jugador);
            }
        }

        if (resumen.length() > 1)
            partido.setGoleadores(resumen.substring(0, resumen.length() - 1));

        if (!esPlayoff) {
            if (partido.getLocal() != null) {
                actualizarClasificacion(partido.getLocal(), gL, gV, esBasket);
                equipoRepository.save(partido.getLocal());
            }
            if (partido.getVisitante() != null) {
                actualizarClasificacion(partido.getVisitante(), gV, gL, esBasket);
                equipoRepository.save(partido.getVisitante());
            }
        }

        partido.setEstado(Partido.EstadoPartido.FINALIZADO_Y_FIRMADO);
        Partido guardado = partidoRepository.save(partido);

        if (esPlayoff) {
            Equipo ganador = (gL > gV) ? partido.getLocal() : partido.getVisitante();
            avanzarGanador(partido.getCodigoEliminatoria(), ganador, ligaId);
        } else {
            boolean todosFinalizados = partidoRepository.findByLigaId(ligaId).stream()
                    .filter(p -> p.getTipoPartido() == null || p.getTipoPartido() == Partido.TipoPartido.REGULAR)
                    .allMatch(p -> p.getEstado() == Partido.EstadoPartido.FINALIZADO_Y_FIRMADO);
            if (todosFinalizados)
                generarCuartosDeFinSiProcede(ligaId);
        }

        publicarNoticia(guardado, ligaId, esBasket);
        return ResponseEntity.ok(guardado);
    }

    @PostMapping("/generar-playoffs")
    public ResponseEntity<?> generarPlayoffs() {
        Long ligaId = SecurityUtils.getLigaId();
        if (partidoRepository.existsByTipoPartidoAndLigaId(Partido.TipoPartido.CUARTOS, ligaId))
            return ResponseEntity.badRequest().body("Los play-offs ya han sido generados.");
        if (equipoRepository.findByLigaId(ligaId).size() < 8)
            return ResponseEntity.badRequest().body("Se necesitan al menos 8 equipos para generar los play-offs.");

        generarCuartosDeFinSiProcede(ligaId);
        return ResponseEntity.ok(partidoRepository.findByTipoPartidoAndLigaId(Partido.TipoPartido.CUARTOS, ligaId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPartido(@PathVariable Long id) {
        Long ligaId = SecurityUtils.getLigaId();
        return partidoRepository.findById(id)
                .filter(p -> ligaId.equals(p.getLigaId()))
                .map(p -> {
                    partidoRepository.delete(p);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/acta-pdf")
    public ResponseEntity<byte[]> descargarActaPdf(@PathVariable Long id) {
        Long ligaId = SecurityUtils.getLigaId();
        Optional<Partido> partidoOpt = partidoRepository.findById(id);

        if (partidoOpt.isEmpty() || !ligaId.equals(partidoOpt.get().getLigaId()))
            return ResponseEntity.notFound().build();

        Partido partido = partidoOpt.get();
        if (partido.getEstado() != Partido.EstadoPartido.FINALIZADO_Y_FIRMADO)
            return ResponseEntity.badRequest().build();

        byte[] pdf = pdfService.generarActaPartidoPdf(partido);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "acta_partido_" + id + ".pdf");

        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    // Helpers

    private boolean esLigaDeBaloncesto(Long ligaId) {
        return ligaRepository.findById(ligaId)
                .map(l -> l.getDeporte() == Deporte.BALONCESTO)
                .orElse(false);
    }

    // Fútbol: V=3, E=1, D=0 | Baloncesto: V=2, D=1, sin empates
    private void actualizarClasificacion(Equipo equipo, int golesF, int golesC, boolean esBasket) {
        equipo.setPj(safe(equipo.getPj()) + 1);
        equipo.setGf(safe(equipo.getGf()) + golesF);
        equipo.setGc(safe(equipo.getGc()) + golesC);
        if (golesF > golesC) {
            equipo.setPg(safe(equipo.getPg()) + 1);
            equipo.setPts(safe(equipo.getPts()) + (esBasket ? 2 : 3));
        } else if (!esBasket && golesF == golesC) {
            equipo.setPe(safe(equipo.getPe()) + 1);
            equipo.setPts(safe(equipo.getPts()) + 1);
        } else {
            equipo.setPp(safe(equipo.getPp()) + 1);
            if (esBasket)
                equipo.setPts(safe(equipo.getPts()) + 1);
        }
    }

    private void procesarIncidencia(Jugador j, String tipo, Integer valorAnotacion, StringBuilder resumen,
            boolean esBasket) {
        switch (tipo.toUpperCase()) {
            case "GOL":
            case "PUNTOS":
                int pts = (valorAnotacion != null && valorAnotacion > 0) ? valorAnotacion : 1;
                j.setGoles(safe(j.getGoles()) + pts);
                if (esBasket) {
                    String etiqueta = pts == 1 ? "+1 pt (Tiro Libre)" : pts == 2 ? "+2 pts (Canasta)" : "+3 pts";
                    resumen.append(j.getNombre()).append(" - ").append(etiqueta).append("\n");
                } else {
                    resumen.append(j.getNombre()).append(" - Gol\n");
                }
                break;
            case "TRIPLE":
                j.setTriples(safe(j.getTriples()) + 1);
                j.setGoles(safe(j.getGoles()) + 3);
                resumen.append(j.getNombre()).append(" - +3 pts (Triple)\n");
                break;
            case "REBOTE":
                j.setRebotes(safe(j.getRebotes()) + 1);
                break;
            case "ASIST":
                j.setAsist(safe(j.getAsist()) + 1);
                break;
            case "AMARILLA":
                j.setAmarillas(safe(j.getAmarillas()) + 1);
                aplicarMulta(j.getEquipo(), MULTA_AMARILLA);
                break;
            case "ROJA":
                j.setRojas(safe(j.getRojas()) + 1);
                aplicarMulta(j.getEquipo(), MULTA_ROJA);
                break;
        }
    }

    private void procesarIncidenciaFirma(Jugador jugador, String tipo, Integer valorAnotacion, StringBuilder resumen,
            boolean esBasket) {
        switch (tipo.toUpperCase()) {
            case "GOL":
            case "PUNTOS":
                int pts = (valorAnotacion != null && valorAnotacion > 0) ? valorAnotacion : 1;
                jugador.setGoles(safe(jugador.getGoles()) + pts);
                if (esBasket) {
                    String etiqueta = pts == 1 ? "+1 pt (Tiro Libre)" : pts == 2 ? "+2 pts (Canasta)" : "+3 pts";
                    resumen.append(jugador.getNombre()).append(" - ").append(etiqueta).append("\n");
                } else {
                    resumen.append(jugador.getNombre()).append(" - Gol\n");
                }
                break;
            case "TRIPLE":
                jugador.setTriples(safe(jugador.getTriples()) + 1);
                jugador.setGoles(safe(jugador.getGoles()) + 3);
                resumen.append(jugador.getNombre()).append(" - +3 pts (Triple)\n");
                break;
            case "REBOTE":
                jugador.setRebotes(safe(jugador.getRebotes()) + 1);
                break;
            case "ASIST":
                jugador.setAsist(safe(jugador.getAsist()) + 1);
                break;
            case "AMARILLA":
                jugador.setAmarillas(safe(jugador.getAmarillas()) + 1);
                int acumuladas = safe(jugador.getTarjetasAmarillasAcumuladas()) + 1;
                jugador.setTarjetasAmarillasAcumuladas(acumuladas);
                if (acumuladas >= AMARILLAS_PARA_SANCION) {
                    jugador.setEstadoDisciplinario(Jugador.EstadoDisciplinario.SANCIONADO);
                    jugador.setTarjetasAmarillasAcumuladas(0);
                }
                aplicarMulta(jugador.getEquipo(), MULTA_AMARILLA);
                break;
            case "ROJA":
                jugador.setRojas(safe(jugador.getRojas()) + 1);
                jugador.setEstadoDisciplinario(Jugador.EstadoDisciplinario.SANCIONADO);
                aplicarMulta(jugador.getEquipo(), MULTA_ROJA);
                break;
        }
    }

    private void aplicarMulta(Equipo equipo, double multa) {
        if (equipo == null)
            return;
        equipo.setDeudaAcumulada((equipo.getDeudaAcumulada() != null ? equipo.getDeudaAcumulada() : 0.0) + multa);
    }

    private void publicarNoticia(Partido partido, Long ligaId, boolean esBasket) {
        String nombreLocal = partido.getLocal() != null ? partido.getLocal().getNombre() : "Local";
        String nombreVisitante = partido.getVisitante() != null ? partido.getVisitante().getNombre() : "Visitante";
        String marcador = partido.getGolesLocal() + " - " + partido.getGolesVisitante();
        String titulo = "Resultado: " + nombreLocal + " " + marcador + " " + nombreVisitante;
        String incidenciasLabel = esBasket ? "Puntos: " : "Goles: ";
        String contenido = "Jornada " + partido.getJornada() + ". " + titulo +
                (partido.getGoleadores() != null ? ". " + incidenciasLabel + partido.getGoleadores() : "");

        Noticia noticia = new Noticia();
        noticia.setTitulo(titulo);
        noticia.setContenido(contenido);
        noticia.setFecha(LocalDate.now().toString());
        noticia.setLigaId(ligaId);
        noticiaRepository.save(noticia);
    }

    private Partido crearPartidoPlayoff(Equipo local, Equipo visitante, Partido.TipoPartido tipo, String codigo,
            Long ligaId) {
        Partido p = new Partido();
        p.setLocal(local);
        p.setVisitante(visitante);
        p.setTipoPartido(tipo);
        p.setCodigoEliminatoria(codigo);
        p.setFecha(LocalDate.now().plusDays(7).toString());
        p.setEstado(Partido.EstadoPartido.PENDIENTE);
        p.setLigaId(ligaId);
        return p;
    }

    private void generarCuartosDeFinSiProcede(Long ligaId) {
        if (partidoRepository.existsByTipoPartidoAndLigaId(Partido.TipoPartido.CUARTOS, ligaId))
            return;

        List<Equipo> clasificacion = new ArrayList<>(equipoRepository.findByLigaId(ligaId));
        if (clasificacion.size() < 8)
            return;

        clasificacion.sort((a, b) -> {
            int ptsDiff = safe(b.getPts()) - safe(a.getPts());
            if (ptsDiff != 0)
                return ptsDiff;
            return (safe(b.getGf()) - safe(b.getGc())) - (safe(a.getGf()) - safe(a.getGc()));
        });

        List<Partido> cuartos = new ArrayList<>();
        cuartos.add(crearPartidoPlayoff(clasificacion.get(0), clasificacion.get(7), Partido.TipoPartido.CUARTOS,
                "CUARTOS_1", ligaId));
        cuartos.add(crearPartidoPlayoff(clasificacion.get(3), clasificacion.get(4), Partido.TipoPartido.CUARTOS,
                "CUARTOS_2", ligaId));
        cuartos.add(crearPartidoPlayoff(clasificacion.get(1), clasificacion.get(6), Partido.TipoPartido.CUARTOS,
                "CUARTOS_3", ligaId));
        cuartos.add(crearPartidoPlayoff(clasificacion.get(2), clasificacion.get(5), Partido.TipoPartido.CUARTOS,
                "CUARTOS_4", ligaId));
        partidoRepository.saveAll(cuartos);

        Noticia noticia = new Noticia();
        noticia.setTitulo("¡Comienzan los Play-offs!");
        noticia.setContenido("La fase regular ha concluido. Los cuartos de final ya están disponibles.");
        noticia.setFecha(LocalDate.now().toString());
        noticia.setLigaId(ligaId);
        noticiaRepository.save(noticia);
    }

    private void avanzarGanador(String codigoActual, Equipo ganador, Long ligaId) {
        if (codigoActual == null)
            return;
        String siguienteCodigo;
        boolean esLocal;
        Partido.TipoPartido siguienteTipo;
        switch (codigoActual) {
            case "CUARTOS_1":
                siguienteCodigo = "SEMI_1";
                esLocal = true;
                siguienteTipo = Partido.TipoPartido.SEMIFINAL;
                break;
            case "CUARTOS_2":
                siguienteCodigo = "SEMI_1";
                esLocal = false;
                siguienteTipo = Partido.TipoPartido.SEMIFINAL;
                break;
            case "CUARTOS_3":
                siguienteCodigo = "SEMI_2";
                esLocal = true;
                siguienteTipo = Partido.TipoPartido.SEMIFINAL;
                break;
            case "CUARTOS_4":
                siguienteCodigo = "SEMI_2";
                esLocal = false;
                siguienteTipo = Partido.TipoPartido.SEMIFINAL;
                break;
            case "SEMI_1":
                siguienteCodigo = "FINAL";
                esLocal = true;
                siguienteTipo = Partido.TipoPartido.FINAL;
                break;
            case "SEMI_2":
                siguienteCodigo = "FINAL";
                esLocal = false;
                siguienteTipo = Partido.TipoPartido.FINAL;
                break;
            default:
                return;
        }
        Partido siguiente = partidoRepository.findByCodigoEliminatoriaAndLigaId(siguienteCodigo, ligaId)
                .orElseGet(() -> {
                    Partido nuevo = new Partido();
                    nuevo.setCodigoEliminatoria(siguienteCodigo);
                    nuevo.setTipoPartido(siguienteTipo);
                    nuevo.setEstado(Partido.EstadoPartido.PENDIENTE);
                    nuevo.setFecha(LocalDate.now().plusDays(14).toString());
                    nuevo.setLigaId(ligaId);
                    return nuevo;
                });
        if (esLocal)
            siguiente.setLocal(ganador);
        else
            siguiente.setVisitante(ganador);
        partidoRepository.save(siguiente);
    }

    private int safe(Integer val) {
        return val != null ? val : 0;
    }
}
