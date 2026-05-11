package LigaSync.API.security;

import io.jsonwebtoken.Claims;
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
    private static final long EXPIRATION_TIME = 86400000; // 24 horas en ms

    public String generateToken(String email, String rol, Long ligaId) {
        return Jwts.builder()
                .setSubject(email)
                .claim("rol", rol)
                .claim("ligaId", ligaId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // JWT puede serializar IDs pequeños como Integer — manejamos ambos tipos
    public Long extractLigaId(String token) {
        Object raw = extractClaims(token).get("ligaId");
        if (raw instanceof Integer) return ((Integer) raw).longValue();
        return raw != null ? (Long) raw : null;
    }
}
