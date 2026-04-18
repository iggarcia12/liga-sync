package LigaSync.API.repository;

import LigaSync.API.model.Noticia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticiaRepository extends JpaRepository<Noticia, Long> {
    // Devuelve noticias ordenadas por ID descendente (más recientes primero)
    List<Noticia> findAllByOrderByIdDesc();
}