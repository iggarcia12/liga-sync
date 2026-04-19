package LigaSync.API.dto;

import java.util.List;

public class MatchResultRequest {
    private Integer golesLocal;
    private Integer golesVisitante;
    private List<IncidenciaDTO> incidencias;

    public static class IncidenciaDTO {
        private Long jugadorId;
        private String tipo; // "GOL", "ASIST", "AMARILLA", "ROJA"

        public Long getJugadorId() { return jugadorId; }
        public void setJugadorId(Long jugadorId) { this.jugadorId = jugadorId; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
    }

    public Integer getGolesLocal() { return golesLocal; }
    public void setGolesLocal(Integer golesLocal) { this.golesLocal = golesLocal; }
    public Integer getGolesVisitante() { return golesVisitante; }
    public void setGolesVisitante(Integer golesVisitante) { this.golesVisitante = golesVisitante; }
    public List<IncidenciaDTO> getIncidencias() { return incidencias; }
    public void setIncidencias(List<IncidenciaDTO> incidencias) { this.incidencias = incidencias; }
}
