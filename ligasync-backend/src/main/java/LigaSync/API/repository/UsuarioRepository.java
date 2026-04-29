package LigaSync.API.repository;

import LigaSync.API.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Usuario findByEmail(String email);

    List<Usuario> findByLigaId(Long ligaId);

    Usuario findByEmailAndLigaId(String email, Long ligaId);

    Optional<Usuario> findByTeamIdAndRole(Integer teamId, String role);
}