package LigaSync.API.controller;

import LigaSync.API.model.Noticia;
import LigaSync.API.repository.NoticiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/noticias")
public class NoticiaController {

    @Autowired
    private NoticiaRepository noticiaRepository;

    // Obtener todas las noticias, ordenadas por id descendente (más recientes primero)
    @GetMapping
    public List<Noticia> obtenerNoticias() {
        return noticiaRepository.findAllByOrderByIdDesc();
    }

    // Crear una noticia (manual desde el admin o automática desde PartidoController)
    @PostMapping
    public Noticia crearNoticia(@RequestBody Noticia noticia) {
        return noticiaRepository.save(noticia);
    }

    // Eliminar una noticia por ID (solo admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarNoticia(@PathVariable Long id) {
        if (!noticiaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        noticiaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}