package LigaSync.API.repository;

import LigaSync.API.model.Oferta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfertaRepository extends JpaRepository<Oferta, Long> {
    List<Oferta> findByEquipoDestinoId(Long equipoDestinoId);
    List<Oferta> findByEquipoOrigenId(Long equipoOrigenId);
    List<Oferta> findByJugadorIdAndEstado(Long jugadorId, Oferta.Estado estado);
}
