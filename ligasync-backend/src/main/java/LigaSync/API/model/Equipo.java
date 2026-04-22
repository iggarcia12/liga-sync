package LigaSync.API.model;

import jakarta.persistence.*;

@Entity
@Table(name = "equipos")
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    private String escudo; // El emoji o la URL de la imagen

    private String ciudad;

    private Integer presupuesto = 0; // Valor por defecto

    private String formacion = "4-4-2";

    // Estadísticas de la liga
    private Integer pts = 0;
    private Integer pj = 0; // Partidos jugados
    private Integer pg = 0; // Partidos ganados
    private Integer pe = 0; // Empatados
    private Integer pp = 0; // Perdidos
    private Integer gf = 0; // Goles a favor
    private Integer gc = 0; // Goles en contra

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

    public String getEscudo() {
        return escudo;
    }

    public void setEscudo(String escudo) {
        this.escudo = escudo;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public Integer getPresupuesto() {
        return presupuesto;
    }

    public void setPresupuesto(Integer presupuesto) {
        this.presupuesto = presupuesto;
    }

    public Integer getPts() {
        return pts;
    }

    public void setPts(Integer pts) {
        this.pts = pts;
    }

    public Integer getPj() {
        return pj;
    }

    public void setPj(Integer pj) {
        this.pj = pj;
    }

    public Integer getPg() {
        return pg;
    }

    public void setPg(Integer pg) {
        this.pg = pg;
    }

    public Integer getPe() {
        return pe;
    }

    public void setPe(Integer pe) {
        this.pe = pe;
    }

    public Integer getPp() {
        return pp;
    }

    public void setPp(Integer pp) {
        this.pp = pp;
    }

    public Integer getGf() {
        return gf;
    }

    public void setGf(Integer gf) {
        this.gf = gf;
    }

    public Integer getGc() {
        return gc;
    }

    public void setGc(Integer gc) {
        this.gc = gc;
    }

    public String getFormacion() {
        return formacion;
    }

    public void setFormacion(String formacion) {
        this.formacion = formacion;
    }
}