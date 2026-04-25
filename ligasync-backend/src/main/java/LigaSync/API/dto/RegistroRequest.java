package LigaSync.API.dto;

public class RegistroRequest {

    private String nombre;
    private String email;
    private String pass;
    private String tipoAccion; // "CREAR" o "UNIRSE"
    private String nombreLiga;
    private String deporte;   // "FUTBOL" o "BALONCESTO" (solo en CREAR)

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPass() { return pass; }
    public void setPass(String pass) { this.pass = pass; }

    public String getTipoAccion() { return tipoAccion; }
    public void setTipoAccion(String tipoAccion) { this.tipoAccion = tipoAccion; }

    public String getNombreLiga() { return nombreLiga; }
    public void setNombreLiga(String nombreLiga) { this.nombreLiga = nombreLiga; }

    public String getDeporte() { return deporte; }
    public void setDeporte(String deporte) { this.deporte = deporte; }
}
