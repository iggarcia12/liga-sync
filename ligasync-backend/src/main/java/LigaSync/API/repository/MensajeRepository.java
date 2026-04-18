package LigaSync.API.repository;

import LigaSync.API.model.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    // Todos los mensajes de un usuario (como remitente o destinatario)
    List<Mensaje> findByRemitenteIdOrDestinatarioIdOrderByFechaEnvioAsc(Long remitenteId, Long destinatarioId);

    // Conversación entre dos usuarios específicos
    @Query("SELECT m FROM Mensaje m WHERE " +
           "(m.remitenteId = :user1 AND m.destinatarioId = :user2) OR " +
           "(m.remitenteId = :user2 AND m.destinatarioId = :user1) " +
           "ORDER BY m.fechaEnvio ASC")
    List<Mensaje> findConversacion(@Param("user1") Long user1, @Param("user2") Long user2);

    // IDs de usuarios con los que ha hablado un usuario
    @Query("SELECT DISTINCT CASE WHEN m.remitenteId = :userId THEN m.destinatarioId ELSE m.remitenteId END " +
           "FROM Mensaje m WHERE m.remitenteId = :userId OR m.destinatarioId = :userId")
    List<Long> findContactIds(@Param("userId") Long userId);
}
