package LigaSync.API.controller;

import LigaSync.API.model.Noticia;
import LigaSync.API.repository.NoticiaRepository;
import LigaSync.API.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/noticias")
public class NoticiaController {

    @Autowired
    private NoticiaRepository noticiaRepository;

    @GetMapping
    public List<Noticia> obtenerNoticias() {
        return noticiaRepository.findByLigaIdOrderByIdDesc(SecurityUtils.getLigaId());
    }

    @PostMapping
    public Noticia crearNoticia(@RequestBody Noticia noticia) {
        noticia.setLigaId(SecurityUtils.getLigaId());
        return noticiaRepository.save(noticia);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarNoticia(@PathVariable Long id) {
        Long ligaId = SecurityUtils.getLigaId();
        return noticiaRepository.findById(id)
                .filter(n -> ligaId.equals(n.getLigaId()))
                .map(n -> {
                    noticiaRepository.delete(n);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
