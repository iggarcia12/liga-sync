package LigaSync.API.dto;

import lombok.Data;

@Data
public class AsignarLigaRequest {
    private String tipoAccion;
    private String nombreLiga;
    private String deporte;
}
