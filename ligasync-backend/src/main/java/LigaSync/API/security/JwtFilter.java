package LigaSync.API.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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
        Long ligaId = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7);
            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(SECRET_KEY.getBytes())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                email = claims.getSubject();
                rol = claims.get("rol", String.class);

                // Extrae ligaId
                Object rawLigaId = claims.get("ligaId");
                if (rawLigaId instanceof Integer) {
                    ligaId = ((Integer) rawLigaId).longValue();
                } else if (rawLigaId instanceof Long) {
                    ligaId = (Long) rawLigaId;
                }
            } catch (Exception e) {
                System.out.println("Token inválido o caducado: " + e.getMessage());
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            String rolNormalizado = (rol != null && !rol.isEmpty()) ? rol.toUpperCase().replace("ROLE_", "") : "USER";
            String authority = "ROLE_" + rolNormalizado;
            SimpleGrantedAuthority grantedAuthority = new SimpleGrantedAuthority(authority);

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    email, null, Collections.singletonList(grantedAuthority));

            // ligaId disponible en todos los controladores vía auth.getDetails()
            auth.setDetails(ligaId);

            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
