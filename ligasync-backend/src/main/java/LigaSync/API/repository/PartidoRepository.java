package LigaSync.API.repository;

import LigaSync.API.model.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidoRepository extends JpaRepository<Partido, Long> {
    // Truco: Spring inventa la consulta para sacar todos los partidos de una
    // jornada
    List<Partido> findByJornada(Integer jornada);
}