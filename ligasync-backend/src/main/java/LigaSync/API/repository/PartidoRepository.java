package LigaSync.API.repository;

import LigaSync.API.model.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartidoRepository extends JpaRepository<Partido, Long> {

    // Versiones scoped por liga
    List<Partido> findByLigaId(Long ligaId);

    List<Partido> findByJornadaAndLigaId(Integer jornada, Long ligaId);

    @Query("SELECT COALESCE(MAX(p.jornada), 0) FROM Partido p WHERE p.golesLocal IS NOT NULL AND p.ligaId = :ligaId")
    Integer findJornadaActualByLiga(@Param("ligaId") Long ligaId);

    List<Partido> findByTipoPartidoAndLigaId(Partido.TipoPartido tipoPartido, Long ligaId);

    boolean existsByTipoPartidoAndLigaId(Partido.TipoPartido tipoPartido, Long ligaId);

    Optional<Partido> findByCodigoEliminatoriaAndLigaId(String codigoEliminatoria, Long ligaId);
}