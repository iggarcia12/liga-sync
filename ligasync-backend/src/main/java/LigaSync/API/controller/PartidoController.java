package LigaSync.API.controller;

import LigaSync.API.model.Partido;
import LigaSync.API.model.Noticia;
import LigaSync.API.model.Equipo;
import LigaSync.API.model.Jugador;
import LigaSync.API.dto.MatchResultRequest;
import LigaSync.API.repository.PartidoRepository;
import LigaSync.API.repository.NoticiaRepository;
import LigaSync.API.repository.EquipoRepository;
import LigaSync.API.repository.JugadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
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

    // Ver todos los partidos (El calendario completo)
    @GetMapping
    public List<Partido> obtenerPartidos() {
        return partidoRepository.findAll();
    }

    // Ver partidos de una jornada específica
    @GetMapping("/jornada/{numJornada}")
    public List<Partido> obtenerPorJornada(@PathVariable Integer numJornada) {
        return partidoRepository.findByJornada(numJornada);
    }

    // Registrar un nuevo partido (Manual)
    @PostMapping
    public Partido registrarPartido(@RequestBody Partido partido) {
        return partidoRepository.save(partido);
    }

    // Generar calendario automático (Round Robin Ida y Vuelta)
    @PostMapping("/generar-calendario")
    public ResponseEntity<List<Partido>> generarCalendario() {
        List<Equipo> equipos = equipoRepository.findAll();
        if (equipos.size() < 2) {
            return ResponseEntity.badRequest().build();
        }

        // Limpiar calendario anterior
        partidoRepository.deleteAll();

        List<Partido> partidosGenerados = new ArrayList<>();
        int numEquipos = equipos.size();
        boolean esImpar = (numEquipos % 2 != 0);

        if (esImpar) {
            numEquipos++; // Añadimos un "Fantasma" para el descanso
        }

        int jornadas = numEquipos - 1;
        int partidosPorJornada = numEquipos / 2;

        // Algoritmo Round Robin
        for (int j = 0; j < jornadas; j++) {
            for (int p = 0; p < partidosPorJornada; p++) {
                int localIdx = (j + p) % (numEquipos - 1);
                int visitanteIdx = (j + numEquipos - 1 - p) % (numEquipos - 1);

                if (p == 0) {
                    visitanteIdx = numEquipos - 1;
                }

                // Si no es el equipo fantasma
                if ((!esImpar) || (localIdx < equipos.size() && visitanteIdx < equipos.size())) {
                    Equipo local = equipos.get(localIdx);
                    Equipo visitante = equipos.get(visitanteIdx);

                    // IDA
                    Partido ida = new Partido();
                    ida.setLocal(local);
                    ida.setVisitante(visitante);
                    ida.setJornada(j + 1);
                    ida.setFecha(LocalDate.now().plusDays(j * 7).toString());
                    partidosGenerados.add(ida);

                    // VUELTA (en la segunda mitad de la temporada)
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

    // Registrar resultado y actualizar estadísticas de jugadores
    @PutMapping("/{id}/resultado")
    public ResponseEntity<Partido> actualizarResultado(@PathVariable Long id, @RequestBody MatchResultRequest request) {
        Optional<Partido> partidoOpt = partidoRepository.findById(id);
        if (partidoOpt.isEmpty()) return ResponseEntity.notFound().build();

        Partido partido = partidoOpt.get();
        partido.setGolesLocal(request.getGolesLocal());
        partido.setGolesVisitante(request.getGolesVisitante());

        // Procesar incidencias (goles, asistencias, tarjetas)
        StringBuilder resumenGoleadores = new StringBuilder();
        if (request.getIncidencias() != null) {
            for (MatchResultRequest.IncidenciaDTO inc : request.getIncidencias()) {
                Optional<Jugador> jugOpt = jugadorRepository.findById(inc.getJugadorId());
                if (jugOpt.isPresent()) {
                    Jugador j = jugOpt.get();
                    switch (inc.getTipo().toUpperCase()) {
                        case "GOL":
                            j.setGoles(j.getGoles() + 1);
                            resumenGoleadores.append(j.getNombre()).append(" (gol), ");
                            break;
                        case "ASIST":
                            j.setAsist(j.getAsist() + 1);
                            break;
                        case "AMARILLA":
                            j.setAmarillas(j.getAmarillas() + 1);
                            break;
                        case "ROJA":
                            j.setRojas(j.getRojas() + 1);
                            break;
                    }
                    jugadorRepository.save(j);
                }
            }
        }
        
        if (resumenGoleadores.length() > 2) {
            partido.setGoleadores(resumenGoleadores.substring(0, resumenGoleadores.length() - 2));
        }

        // Actualizar estadísticas de los equipos
        Equipo local = partido.getLocal();
        Equipo visitante = partido.getVisitante();
        int gL = request.getGolesLocal();
        int gV = request.getGolesVisitante();

        if (local != null) {
            local.setPj(local.getPj() + 1);
            local.setGf(local.getGf() + gL);
            local.setGc(local.getGc() + gV);
            if (gL > gV) {
                local.setPg(local.getPg() + 1);
                local.setPts(local.getPts() + 3);
            } else if (gL == gV) {
                local.setPe(local.getPe() + 1);
                local.setPts(local.getPts() + 1);
            } else {
                local.setPp(local.getPp() + 1);
            }
            equipoRepository.save(local);
        }

        if (visitante != null) {
            visitante.setPj(visitante.getPj() + 1);
            visitante.setGf(visitante.getGf() + gV);
            visitante.setGc(visitante.getGc() + gL);
            if (gV > gL) {
                visitante.setPg(visitante.getPg() + 1);
                visitante.setPts(visitante.getPts() + 3);
            } else if (gV == gL) {
                visitante.setPe(visitante.getPe() + 1);
                visitante.setPts(visitante.getPts() + 1);
            } else {
                visitante.setPp(visitante.getPp() + 1);
            }
            equipoRepository.save(visitante);
        }

        Partido guardado = partidoRepository.save(partido);

        // Crear noticia automática
        String nombreLocal = guardado.getLocal() != null ? guardado.getLocal().getNombre() : "Equipo Local";
        String nombreVisitante = guardado.getVisitante() != null ? guardado.getVisitante().getNombre() : "Equipo Visitante";

        String titulo = "Resultado: " + nombreLocal + " " + guardado.getGolesLocal() + " - " + guardado.getGolesVisitante() + " " + nombreVisitante;
        String contenido = "Jornada " + guardado.getJornada() + ". Final del partido en " + nombreLocal + ". " + 
                          titulo + (guardado.getGoleadores() != null ? ". Goles: " + guardado.getGoleadores() : "");

        Noticia noticia = new Noticia();
        noticia.setTitulo(titulo);
        noticia.setContenido(contenido);
        noticia.setFecha(LocalDate.now().toString());
        noticiaRepository.save(noticia);

        return ResponseEntity.ok(guardado);
    }



    // Eliminar un partido
    @DeleteMapping("/{id}")
    public void eliminarPartido(@PathVariable Long id) {
        partidoRepository.deleteById(id);
    }
}