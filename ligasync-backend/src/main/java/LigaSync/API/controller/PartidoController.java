package LigaSync.API.controller;

import LigaSync.API.model.Partido;
import LigaSync.API.repository.PartidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partidos")
public class PartidoController {

    @Autowired
    private PartidoRepository partidoRepository;

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
        return partidoRepository.save(partido);
    }
}