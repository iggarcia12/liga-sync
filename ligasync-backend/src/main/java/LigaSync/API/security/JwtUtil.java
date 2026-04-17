package LigaSync.API.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_KEY = "LigaSyncTFG_SuperSecretaClaveParaGenerarTokens123456789";
    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    // El token durará 24 horas
    private static final long EXPIRATION_TIME = 86400000;

    // Método para fabricar el token con el ROL incluido
    public String generateToken(String email, String rol) {
        return Jwts.builder()
                .setSubject(email)
                .claim("rol", rol)           // <-- Guardamos el rol en el token
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}