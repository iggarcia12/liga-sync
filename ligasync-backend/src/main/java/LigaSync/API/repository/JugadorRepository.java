package LigaSync.API.repository;

import LigaSync.API.model.Jugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {
    // Truco PRO: Spring inventa la consulta para buscar jugadores de un equipo
    // específico
    List<Jugador> findByEquipoId(Long equipoId);
}