package LigaSync.API.dto;

public class RangoRequest {

    private String role;
    private Integer teamId;
    private Long jugadorId;

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getTeamId() { return teamId; }
    public void setTeamId(Integer teamId) { this.teamId = teamId; }

    public Long getJugadorId() { return jugadorId; }
    public void setJugadorId(Long jugadorId) { this.jugadorId = jugadorId; }
}
