package LigaSync.API.repository;

import LigaSync.API.model.Jugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    List<Jugador> findByEquipoId(Long equipoId);

    // Incluye agentes libres y jugadores con equipo de la liga
    @Query("SELECT j FROM Jugador j LEFT JOIN j.equipo e WHERE j.ligaId = :ligaId OR e.ligaId = :ligaId")
    List<Jugador> findAllByLiga(@Param("ligaId") Long ligaId);

    List<Jugador> findByEquipo_LigaId(Long ligaId);
}