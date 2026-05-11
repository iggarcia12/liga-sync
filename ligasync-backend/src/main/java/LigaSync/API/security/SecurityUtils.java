package LigaSync.API.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

// Helper para leer el ligaId que JwtFilter inyecta en auth.getDetails()
public class SecurityUtils {

    public static Long getLigaId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof UsernamePasswordAuthenticationToken token) {
            return (Long) token.getDetails();
        }
        return null;
    }
}
