package LigaSync.API.dto;

public class PagoRequest {
    private Long equipoId;
    private String nombreEquipo;
    private long precioCentimos;

    public Long getEquipoId() { return equipoId; }
    public void setEquipoId(Long equipoId) { this.equipoId = equipoId; }

    public String getNombreEquipo() { return nombreEquipo; }
    public void setNombreEquipo(String nombreEquipo) { this.nombreEquipo = nombreEquipo; }

    public long getPrecioCentimos() { return precioCentimos; }
    public void setPrecioCentimos(long precioCentimos) { this.precioCentimos = precioCentimos; }
}
