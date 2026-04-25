package LigaSync.API.repository;

import LigaSync.API.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    // Reemplaza findAll() — devuelve solo equipos de la liga del usuario
    List<Equipo> findByLigaId(Long ligaId);

    // Búsqueda por nombre dentro de una liga (nombre ya no es unique global)
    Optional<Equipo> findByNombreAndLigaId(String nombre, Long ligaId);
}