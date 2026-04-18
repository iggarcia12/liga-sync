package LigaSync.API.controller;

import LigaSync.API.model.Partido;
import LigaSync.API.model.Noticia;
import LigaSync.API.repository.PartidoRepository;
import LigaSync.API.repository.NoticiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/partidos")
public class PartidoController {

    @Autowired
    private PartidoRepository partidoRepository;

    @Autowired
    private NoticiaRepository noticiaRepository;

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

    // Registrar un nuevo partido / resultado
    @PostMapping
    public Partido registrarPartido(@RequestBody Partido partido) {
        Partido guardado = partidoRepository.save(partido);

        // Si el partido tiene resultado (goles definidos), crear noticia automáticamente
        if (guardado.getGolesLocal() != null && guardado.getGolesVisitante() != null) {
            String nombreLocal = guardado.getLocal() != null ? guardado.getLocal().getNombre() : "Equipo Local";
            String nombreVisitante = guardado.getVisitante() != null ? guardado.getVisitante().getNombre() : "Equipo Visitante";

            String titulo = "Resultado: " + nombreLocal + " " + guardado.getGolesLocal()
                    + " - " + guardado.getGolesVisitante() + " " + nombreVisitante;

            String contenido = "Jornada " + (guardado.getJornada() != null ? guardado.getJornada() : "?")
                    + ". " + nombreLocal + " " + guardado.getGolesLocal()
                    + " - " + guardado.getGolesVisitante() + " " + nombreVisitante + ".";

            if (guardado.getGoleadores() != null && !guardado.getGoleadores().isEmpty()) {
                contenido += " Goleadores: " + guardado.getGoleadores();
            }

            Noticia noticia = new Noticia();
            noticia.setTitulo(titulo);
            noticia.setContenido(contenido);
            noticia.setFecha(LocalDate.now().toString());

            noticiaRepository.save(noticia);
        }

        return guardado;
    }
}