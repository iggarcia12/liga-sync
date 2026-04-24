package LigaSync.API.dto;

import java.util.List;

public class FirmarActaRequest {

    private Integer golesLocal;
    private Integer golesVisitante;
    private Long mvpId;
    private List<Long> asistentesIds;
    private List<IncidenciaDTO> incidencias;

    public static class IncidenciaDTO {
        private Long jugadorId;
        private String tipo; // GOL, ASIST, AMARILLA, ROJA

        public Long getJugadorId() { return jugadorId; }
        public void setJugadorId(Long jugadorId) { this.jugadorId = jugadorId; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
    }

    public Integer getGolesLocal() { return golesLocal; }
    public void setGolesLocal(Integer golesLocal) { this.golesLocal = golesLocal; }

    public Integer getGolesVisitante() { return golesVisitante; }
    public void setGolesVisitante(Integer golesVisitante) { this.golesVisitante = golesVisitante; }

    public Long getMvpId() { return mvpId; }
    public void setMvpId(Long mvpId) { this.mvpId = mvpId; }

    public List<Long> getAsistentesIds() { return asistentesIds; }
    public void setAsistentesIds(List<Long> asistentesIds) { this.asistentesIds = asistentesIds; }

    public List<IncidenciaDTO> getIncidencias() { return incidencias; }
    public void setIncidencias(List<IncidenciaDTO> incidencias) { this.incidencias = incidencias; }
}
