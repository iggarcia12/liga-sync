package LigaSync.API.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String remitente;

    @Async
    public void enviarNotificacionOferta(String destinatario, String nombreJugador, String nombreEquipoOferente, double monto) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(destinatario);
            System.out.println("[EmailService] Intentando enviar email a: " + destinatario);
            mensaje.setSubject("Nueva oferta recibida por " + nombreJugador);
            mensaje.setText("Hola,\n\n" +
                    "El equipo " + nombreEquipoOferente + " ha realizado una oferta de " + String.format("%.0f", monto) + " por tu jugador " + nombreJugador + ".\n\n" +
                    "Inicia sesión en LigaSync para gestionar esta oferta en el panel de equipo.\n\n" +
                    "Un saludo,\n" +
                    "El equipo de LigaSync");

            mailSender.send(mensaje);
            System.out.println("[EmailService] Email enviado correctamente a: " + destinatario);
        } catch (Exception e) {
            System.err.println("[EmailService] Error al enviar el email a " + destinatario + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
