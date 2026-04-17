package LigaSync.API.repository;

import LigaSync.API.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // AÑADE ESTA LÍNEA SI NO LA TIENES:
    Usuario findByEmail(String email);
}