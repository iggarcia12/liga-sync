package LigaSync.API.controller;

import LigaSync.API.dto.LigaBuscadaDto;
import LigaSync.API.model.Deporte;
import LigaSync.API.model.Liga;
import LigaSync.API.repository.LigaRepository;
import LigaSync.API.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ligas")
public class LigaController {

    @Autowired
    private LigaRepository ligaRepository;

    @GetMapping("/buscar")
    public List<LigaBuscadaDto> buscarLigas(
            @RequestParam String q,
            @RequestParam(required = false) Deporte deporte) {

        if (q == null || q.trim().length() < 2) return List.of();

        List<Liga> ligas = (deporte != null)
                ? ligaRepository.findByNombreContainingIgnoreCaseAndDeporte(q.trim(), deporte)
                : ligaRepository.findByNombreContainingIgnoreCase(q.trim());

        return ligas.stream()
                .map(l -> new LigaBuscadaDto(l.getId(), l.getNombre(), l.getDeporte()))
                .limit(8)
                .toList();
    }

    @GetMapping("/actual")
    public ResponseEntity<Liga> getLigaActual() {
        Long ligaId = SecurityUtils.getLigaId();
        return ligaRepository.findById(ligaId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/mercado-estado")
    public ResponseEntity<?> setMercadoAbierto(@RequestParam boolean abierto) {
        Long ligaId = SecurityUtils.getLigaId();
        return ligaRepository.findById(ligaId).map(liga -> {
            liga.setMercadoAbierto(abierto);
            return ResponseEntity.ok(ligaRepository.save(liga));
        }).orElse(ResponseEntity.notFound().build());
    }
}
