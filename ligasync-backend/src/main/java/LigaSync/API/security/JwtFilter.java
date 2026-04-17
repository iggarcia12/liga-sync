package LigaSync.API.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final String SECRET_KEY = "LigaSyncTFG_SuperSecretaClaveParaGenerarTokens123456789";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;
        String rol = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7);
            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(SECRET_KEY.getBytes())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                email = claims.getSubject();
                rol = claims.get("rol", String.class); // <-- Leemos el rol del token
            } catch (Exception e) {
                System.out.println("Token inválido o caducado: " + e.getMessage());
            }
        }

        // Si el email es válido y aún no hay autenticación en este hilo
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Normalizamos: quitar prefijo si ya lo tiene, pasar a mayúsculas, y añadir ROLE_
            String rolNormalizado = (rol != null && !rol.isEmpty()) ? rol.toUpperCase().replace("ROLE_", "") : "USER";
            String authority = "ROLE_" + rolNormalizado;
            SimpleGrantedAuthority grantedAuthority = new SimpleGrantedAuthority(authority);

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    email, null, Collections.singletonList(grantedAuthority));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}