package LigaSync.API.model;

import jakarta.persistence.*;

@Entity
@Table(name = "jugadores")
public class Jugador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String pos; // POR, DEF, MED, DEL
    private Integer media;
    private Integer valor;

    private Integer goles = 0;
    private Integer asist = 0;
    private Integer amarillas = 0;
    private Integer rojas = 0;
    private Boolean titular = false;

    // --- LA MAGIA DE LAS RELACIONES ---
    // @ManyToOne indica que "Muchos" jugadores pertenecen a "Un" Equipo
    // @JoinColumn crea la columna "equipo_id" en la base de datos (Clave Foránea)
    @ManyToOne
    @JoinColumn(name = "equipo_id")
    private Equipo equipo;

    // --- GETTERS Y SETTERS ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getPos() {
        return pos;
    }

    public void setPos(String pos) {
        this.pos = pos;
    }

    public Integer getMedia() {
        return media;
    }

    public void setMedia(Integer media) {
        this.media = media;
    }

    public Integer getValor() {
        return valor;
    }

    public void setValor(Integer valor) {
        this.valor = valor;
    }

    public Integer getGoles() {
        return goles;
    }

    public void setGoles(Integer goles) {
        this.goles = goles;
    }

    public Integer getAsist() {
        return asist;
    }

    public void setAsist(Integer asist) {
        this.asist = asist;
    }

    public Integer getAmarillas() {
        return amarillas;
    }

    public void setAmarillas(Integer amarillas) {
        this.amarillas = amarillas;
    }

    public Integer getRojas() {
        return rojas;
    }

    public void setRojas(Integer rojas) {
        this.rojas = rojas;
    }

    public Boolean getTitular() {
        return titular;
    }

    public void setTitular(Boolean titular) {
        this.titular = titular;
    }

    public Equipo getEquipo() {
        return equipo;
    }

    public void setEquipo(Equipo equipo) {
        this.equipo = equipo;
    }
}