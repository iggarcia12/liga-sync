package LigaSync.API.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ofertas")
public class Oferta {

    public enum Estado { PENDIENTE, ACEPTADA, RECHAZADA }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "equipo_origen_id", nullable = false)
    private Long equipoOrigenId;   // equipo que compra

    @Column(name = "equipo_destino_id", nullable = false)
    private Long equipoDestinoId;  // equipo que vende

    @Column(name = "jugador_id", nullable = false)
    private Long jugadorId;

    @Column(nullable = false)
    private Integer monto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Estado estado = Estado.PENDIENTE;

    // --- GETTERS Y SETTERS ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEquipoOrigenId() { return equipoOrigenId; }
    public void setEquipoOrigenId(Long equipoOrigenId) { this.equipoOrigenId = equipoOrigenId; }

    public Long getEquipoDestinoId() { return equipoDestinoId; }
    public void setEquipoDestinoId(Long equipoDestinoId) { this.equipoDestinoId = equipoDestinoId; }

    public Long getJugadorId() { return jugadorId; }
    public void setJugadorId(Long jugadorId) { this.jugadorId = jugadorId; }

    public Integer getMonto() { return monto; }
    public void setMonto(Integer monto) { this.monto = monto; }

    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }
}
