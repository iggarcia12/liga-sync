package LigaSync.API.repository;

import LigaSync.API.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Login global: el email identifica al usuario independientemente de la liga
    Usuario findByEmail(String email);

    // Todos los usuarios de una liga
    List<Usuario> findByLigaId(Long ligaId);

    // Buscar un usuario concreto dentro de una liga (útil para validaciones)
    Usuario findByEmailAndLigaId(String email, Long ligaId);
}