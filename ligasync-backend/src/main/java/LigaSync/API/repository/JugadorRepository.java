package LigaSync.API.repository;

import LigaSync.API.model.Jugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    List<Jugador> findByEquipoId(Long equipoId);

    // Navega equipo.ligaId para filtrar jugadores de una liga sin añadir ligaId a Jugador
    List<Jugador> findByEquipo_LigaId(Long ligaId);
}