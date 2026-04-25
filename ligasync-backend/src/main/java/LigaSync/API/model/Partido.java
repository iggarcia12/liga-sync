package LigaSync.API.model;

import jakarta.persistence.*;

@Entity
@Table(name = "partidos")
public class Partido {

    public enum EstadoPartido {
        PENDIENTE, EN_JUEGO, FINALIZADO_Y_FIRMADO
    }

    public enum TipoPartido {
        REGULAR, CUARTOS, SEMIFINAL, FINAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer jornada;

    @Column(name = "goles_local")
    private Integer golesLocal;

    @Column(name = "goles_visitante")
    private Integer golesVisitante;

    private String fecha;

    @Column(columnDefinition = "TEXT")
    private String goleadores;

    @Enumerated(EnumType.STRING)
    private EstadoPartido estado = EstadoPartido.PENDIENTE;

    private Long mvpId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_partido")
    private TipoPartido tipoPartido = TipoPartido.REGULAR;

    // Identifica el cruce en el cuadro: CUARTOS_1, CUARTOS_2, SEMI_1, FINAL…
    @Column(name = "codigo_eliminatoria")
    private String codigoEliminatoria;

    @Column(name = "liga_id")
    private Long ligaId;

    @ManyToOne
    @JoinColumn(name = "local_id")
    private Equipo local;

    @ManyToOne
    @JoinColumn(name = "visitante_id")
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

    public EstadoPartido getEstado() {
        return estado;
    }

    public void setEstado(EstadoPartido estado) {
        this.estado = estado;
    }

    public Long getMvpId() {
        return mvpId;
    }

    public void setMvpId(Long mvpId) {
        this.mvpId = mvpId;
    }

    public TipoPartido getTipoPartido() {
        return tipoPartido;
    }

    public void setTipoPartido(TipoPartido tipoPartido) {
        this.tipoPartido = tipoPartido;
    }

    public String getCodigoEliminatoria() {
        return codigoEliminatoria;
    }

    public void setCodigoEliminatoria(String codigoEliminatoria) {
        this.codigoEliminatoria = codigoEliminatoria;
    }

    public Long getLigaId() {
        return ligaId;
    }

    public void setLigaId(Long ligaId) {
        this.ligaId = ligaId;
    }
}