package LigaSync.API.repository;

import LigaSync.API.model.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidoRepository extends JpaRepository<Partido, Long> {

    List<Partido> findByJornada(Integer jornada);

    // Devuelve la última jornada que tiene resultado (goles registrados)
    @Query("SELECT COALESCE(MAX(p.jornada), 0) FROM Partido p WHERE p.golesLocal IS NOT NULL")
    Integer findJornadaActual();
}