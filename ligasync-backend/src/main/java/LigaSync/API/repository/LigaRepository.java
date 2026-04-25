package LigaSync.API.repository;

import LigaSync.API.model.Deporte;
import LigaSync.API.model.Liga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LigaRepository extends JpaRepository<Liga, Long> {

    Optional<Liga> findByNombre(String nombre);

    boolean existsByNombre(String nombre);

    List<Liga> findByNombreContainingIgnoreCase(String nombre);

    List<Liga> findByNombreContainingIgnoreCaseAndDeporte(String nombre, Deporte deporte);
}
