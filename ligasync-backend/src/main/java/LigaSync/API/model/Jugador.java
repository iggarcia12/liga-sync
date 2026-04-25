package LigaSync.API.model;

import jakarta.persistence.*;

@Entity
@Table(name = "jugadores")
public class Jugador {

    public enum EstadoDisciplinario {
        DISPONIBLE, SANCIONADO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String pos; // fútbol: POR, DEF, MED, DEL | baloncesto: BASE, ESCOLTA, ALERO, ALA_PIVOT, PIVOT
    private Integer media;
    private Integer valor;

    private Integer goles = 0;    // fútbol: goles | baloncesto: puntos
    private Integer asist = 0;    // fútbol: asistencias | baloncesto: asistencias
    private Integer rebotes = 0;  // baloncesto únicamente
    private Integer triples = 0;  // baloncesto únicamente
    private Integer amarillas = 0;
    private Integer rojas = 0;
    private Boolean titular = false;

    @Enumerated(EnumType.STRING)
    private EstadoDisciplinario estadoDisciplinario = EstadoDisciplinario.DISPONIBLE;

    private Integer tarjetasAmarillasAcumuladas = 0;

    private Boolean convocado = false;

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
        recalcularValor();
    }

    // Fórmula exponencial: media 70 ≈ 5M€, media 80 = 25M€, media 90 ≈ 100M€
    public void recalcularValor() {
        if (this.media == null || this.media < 1) {
            this.valor = 0;
            return;
        }
        double valorMillones = Math.pow(this.media / 80.0, 12) * 25;
        this.valor = (int) Math.round(valorMillones * 1_000_000);
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

    public Integer getRebotes() {
        return rebotes;
    }

    public void setRebotes(Integer rebotes) {
        this.rebotes = rebotes;
    }

    public Integer getTriples() {
        return triples;
    }

    public void setTriples(Integer triples) {
        this.triples = triples;
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

    public EstadoDisciplinario getEstadoDisciplinario() {
        return estadoDisciplinario;
    }

    public void setEstadoDisciplinario(EstadoDisciplinario estadoDisciplinario) {
        this.estadoDisciplinario = estadoDisciplinario;
    }

    public Integer getTarjetasAmarillasAcumuladas() {
        return tarjetasAmarillasAcumuladas;
    }

    public void setTarjetasAmarillasAcumuladas(Integer tarjetasAmarillasAcumuladas) {
        this.tarjetasAmarillasAcumuladas = tarjetasAmarillasAcumuladas;
    }

    public Boolean getConvocado() {
        return convocado;
    }

    public void setConvocado(Boolean convocado) {
        this.convocado = convocado;
    }
}