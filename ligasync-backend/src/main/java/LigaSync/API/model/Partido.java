package LigaSync.API.model;

import jakarta.persistence.*;

@Entity
@Table(name = "partidos")
public class Partido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer jornada;

    @Column(name = "goles_local")
    private Integer golesLocal;

    @Column(name = "goles_visitante")
    private Integer golesVisitante;

    private String fecha;

    // Guardaremos los goleadores como texto plano por ahora (ej: "Lamine (12')")
    @Column(columnDefinition = "TEXT")
    private String goleadores;

    // --- LA MAGIA: DOS RELACIONES AL MISMO TIEMPO ---

    @ManyToOne
    @JoinColumn(name = "local_id") // Crea la columna para el equipo de casa
    private Equipo local;

    @ManyToOne
    @JoinColumn(name = "visitante_id") // Crea la columna para el equipo de fuera
    private Equipo visitante;

    // --- GETTERS Y SETTERS ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getJornada() {
        return jornada;
    }

    public void setJornada(Integer jornada) {
        this.jornada = jornada;
    }

    public Integer getGolesLocal() {
        return golesLocal;
    }

    public void setGolesLocal(Integer golesLocal) {
        this.golesLocal = golesLocal;
    }

    public Integer getGolesVisitante() {
        return golesVisitante;
    }

    public void setGolesVisitante(Integer golesVisitante) {
        this.golesVisitante = golesVisitante;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getGoleadores() {
        return goleadores;
    }

    public void setGoleadores(String goleadores) {
        this.goleadores = goleadores;
    }

    public Equipo getLocal() {
        return local;
    }

    public void setLocal(Equipo local) {
        this.local = local;
    }

    public Equipo getVisitante() {
        return visitante;
    }

    public void setVisitante(Equipo visitante) {
        this.visitante = visitante;
    }
}