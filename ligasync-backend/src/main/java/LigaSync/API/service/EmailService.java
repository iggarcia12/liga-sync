package LigaSync.API.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String remitente;

    @Async
    public void enviarBienvenida(String destinatario, String nombre) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom(remitente);
            helper.setTo(destinatario);
            helper.setSubject("¡Bienvenido a LigaSync! ⚽");
            helper.setText(construirHtmlBienvenida(nombre), true);
            mailSender.send(mensaje);
            log.info("Correo de bienvenida enviado a {}", destinatario);
        } catch (MessagingException e) {
            log.error("Error al enviar correo de bienvenida a {}: {}", destinatario, e.getMessage());
        }
    }

    private String construirHtmlBienvenida(String nombre) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
            </head>
            <body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
                      <tr>
                        <td style="background-color:#111111;border-radius:12px 12px 0 0;padding:40px 48px 32px;border-bottom:3px solid #e8ff00;">
                          <h1 style="margin:0;font-size:42px;font-weight:900;letter-spacing:-1px;color:#ffffff;text-transform:uppercase;">
                            LIGA<span style="color:#e8ff00;">SYNC</span>
                          </h1>
                          <p style="margin:8px 0 0;font-size:13px;letter-spacing:4px;color:#888888;text-transform:uppercase;">
                            Panel de Alto Rendimiento
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color:#1a1a1a;padding:48px;">
                          <h2 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;">
                            ¡Hola, %s! 👋
                          </h2>
                          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#aaaaaa;">
                            Tu cuenta en <strong style="color:#e8ff00;">LigaSync</strong> ha sido creada con éxito.
                            Ya tienes acceso a la plataforma de gestión deportiva más completa.
                          </p>
                          <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                            <tr>
                              <td style="padding:14px 16px;background-color:#111111;border-radius:8px;border-left:3px solid #e8ff00;">
                                <span style="color:#e8ff00;">⚽</span>
                                <span style="color:#ffffff;font-size:14px;margin-left:8px;">Gestiona equipos, jugadores y partidos</span>
                              </td>
                            </tr>
                            <tr><td style="height:8px;"></td></tr>
                            <tr>
                              <td style="padding:14px 16px;background-color:#111111;border-radius:8px;border-left:3px solid #e8ff00;">
                                <span style="color:#e8ff00;">📊</span>
                                <span style="color:#ffffff;font-size:14px;margin-left:8px;">Estadísticas en tiempo real de tu liga</span>
                              </td>
                            </tr>
                            <tr><td style="height:8px;"></td></tr>
                            <tr>
                              <td style="padding:14px 16px;background-color:#111111;border-radius:8px;border-left:3px solid #e8ff00;">
                                <span style="color:#e8ff00;">🏆</span>
                                <span style="color:#ffffff;font-size:14px;margin-left:8px;">Clasificaciones y mercado de jugadores</span>
                              </td>
                            </tr>
                          </table>
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-radius:6px;background-color:#e8ff00;">
                                <a href="https://ligasync.com" target="_blank"
                                   style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#000000;text-decoration:none;">
                                  Entrar a LigaSync →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color:#111111;border-radius:0 0 12px 12px;padding:24px 48px;border-top:1px solid #222222;">
                          <p style="margin:0;font-size:12px;color:#555555;text-align:center;">
                            © 2025 LigaSync · Este correo se envió porque te registraste en nuestra plataforma.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(nombre);
    }

    @Async
    public void enviarNotificacionOferta(String destinatario, String nombreJugador, String nombreEquipoOferente, double monto) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom(remitente);
            helper.setTo(destinatario);
            helper.setSubject("💰 Nueva oferta por " + nombreJugador + " · LigaSync");
            helper.setText(construirHtmlOferta(nombreJugador, nombreEquipoOferente, monto), true);
            mailSender.send(mensaje);
            log.info("Correo de oferta enviado a {} por el jugador {}", destinatario, nombreJugador);
        } catch (MessagingException e) {
            log.error("Error al enviar correo de oferta a {}: {}", destinatario, e.getMessage());
        }
    }

    private String construirHtmlOferta(String nombreJugador, String nombreEquipoOferente, double monto) {
        String montoFormateado = String.format("%,.0f", monto);
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
            </head>
            <body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                      <!-- HEADER -->
                      <tr>
                        <td style="background-color:#111111;border-radius:12px 12px 0 0;padding:40px 48px 32px;border-bottom:3px solid #e8ff00;">
                          <h1 style="margin:0;font-size:42px;font-weight:900;letter-spacing:-1px;color:#ffffff;text-transform:uppercase;">
                            LIGA<span style="color:#e8ff00;">SYNC</span>
                          </h1>
                          <p style="margin:8px 0 0;font-size:13px;letter-spacing:4px;color:#888888;text-transform:uppercase;">
                            Mercado de Jugadores
                          </p>
                        </td>
                      </tr>

                      <!-- HERO OFERTA -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#1a1a1a 0%%,#141414 100%%);padding:48px 48px 0;">
                          <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#e8ff00;font-weight:700;">
                            ⚡ OFERTA RECIBIDA
                          </p>
                          <h2 style="margin:0 0 24px;font-size:32px;font-weight:900;color:#ffffff;line-height:1.1;">
                            Han hecho una oferta<br/>por <span style="color:#e8ff00;">%s</span>
                          </h2>
                        </td>
                      </tr>

                      <!-- TARJETA MONTO -->
                      <tr>
                        <td style="background-color:#1a1a1a;padding:24px 48px;">
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background-color:#111111;border-radius:10px;padding:28px 32px;border:1px solid #2a2a2a;">
                                <table width="100%%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="vertical-align:middle;">
                                      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#666666;">Equipo oferente</p>
                                      <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#ffffff;">%s</p>
                                    </td>
                                    <td style="vertical-align:middle;text-align:right;">
                                      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#666666;">Importe ofertado</p>
                                      <p style="margin:6px 0 0;font-size:30px;font-weight:900;color:#e8ff00;letter-spacing:-1px;">€%s</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- CUERPO -->
                      <tr>
                        <td style="background-color:#1a1a1a;padding:8px 48px 40px;">
                          <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#aaaaaa;">
                            Tienes una nueva oferta esperando tu respuesta en el mercado de fichajes.
                            Accede a tu panel para <strong style="color:#ffffff;">aceptarla o rechazarla</strong> antes de que expire.
                          </p>

                          <!-- SEPARADOR -->
                          <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                            <tr>
                              <td style="padding:14px 16px;background-color:#111111;border-radius:8px;border-left:3px solid #e8ff00;">
                                <span style="color:#e8ff00;">⏱</span>
                                <span style="color:#cccccc;font-size:14px;margin-left:8px;">Las ofertas pueden ser retiradas en cualquier momento</span>
                              </td>
                            </tr>
                          </table>

                          <!-- CTA -->
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-radius:6px;background-color:#e8ff00;">
                                <a href="https://ligasync.com" target="_blank"
                                   style="display:inline-block;padding:14px 36px;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#000000;text-decoration:none;">
                                  Ver oferta en LigaSync →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- FOOTER -->
                      <tr>
                        <td style="background-color:#111111;border-radius:0 0 12px 12px;padding:24px 48px;border-top:1px solid #222222;">
                          <p style="margin:0;font-size:12px;color:#555555;text-align:center;">
                            © 2025 LigaSync · Recibes este correo porque eres el propietario de <strong style="color:#777777;">%s</strong>.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(nombreJugador, nombreEquipoOferente, montoFormateado, nombreJugador);
    }
}
