package LigaSync.API.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ligas")
public class Liga {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nombre;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Deporte deporte = Deporte.FUTBOL;

    @Column(name = "mercado_abierto", nullable = false)
    private boolean mercadoAbierto = false;

    // --- GETTERS Y SETTERS ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public Deporte getDeporte() { return deporte; }
    public void setDeporte(Deporte deporte) { this.deporte = deporte; }

    public boolean isMercadoAbierto() { return mercadoAbierto; }
    public void setMercadoAbierto(boolean mercadoAbierto) { this.mercadoAbierto = mercadoAbierto; }
}
