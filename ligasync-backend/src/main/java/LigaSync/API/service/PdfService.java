package LigaSync.API.service;

import LigaSync.API.model.Partido;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;

@Service
public class PdfService {

    private static final DeviceRgb COLOR_PRIMARIO    = new DeviceRgb(30, 64, 175);
    private static final DeviceRgb COLOR_ACENTO      = new DeviceRgb(59, 130, 246);
    private static final DeviceRgb COLOR_AZUL_SUAVE  = new DeviceRgb(147, 197, 253);
    private static final DeviceRgb COLOR_CABECERA_BG = new DeviceRgb(239, 246, 255);
    private static final DeviceRgb COLOR_GRIS_CLARO  = new DeviceRgb(243, 244, 246);
    private static final DeviceRgb COLOR_BORDE_SUAVE = new DeviceRgb(229, 231, 235);
    private static final DeviceRgb COLOR_TEXTO_OSCURO = new DeviceRgb(17, 24, 39);
    private static final DeviceRgb COLOR_TEXTO_MUTED  = new DeviceRgb(107, 114, 128);
    private static final DeviceRgb COLOR_VERDE        = new DeviceRgb(5, 150, 105);
    private static final DeviceRgb COLOR_BLANCO       = new DeviceRgb(255, 255, 255);

    public byte[] generarActaPartidoPdf(Partido partido) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter writer  = new PdfWriter(out);
            PdfDocument pdf   = new PdfDocument(writer);
            Document document = new Document(pdf);
            document.setMargins(36, 50, 36, 50);

            PdfFont fBold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont fRegular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // 1. BANNER CABECERA 
            Table banner = new Table(UnitValue.createPercentArray(new float[]{1}))
                    .useAllAvailableWidth();
            banner.addCell(new Cell()
                    .add(new Paragraph("LIGASYNC — ACTA OFICIAL DE PARTIDO")
                            .setFont(fBold).setFontSize(17).setFontColor(COLOR_BLANCO)
                            .setTextAlignment(TextAlignment.CENTER))
                    .add(new Paragraph("Documento Oficial · Federación LigaSync")
                            .setFont(fRegular).setFontSize(9).setFontColor(COLOR_AZUL_SUAVE)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(COLOR_PRIMARIO)
                    .setBorder(Border.NO_BORDER)
                    .setPaddingTop(16).setPaddingBottom(12)
                    .setPaddingLeft(10).setPaddingRight(10));
            document.add(banner);

            // Sub-banner: ID partido y estado
            String estadoTexto = partido.getEstado() != null
                    ? partido.getEstado().name().replace("_", " ")
                    : "PENDIENTE";
            DeviceRgb colorEstado = (partido.getEstado() == Partido.EstadoPartido.FINALIZADO_Y_FIRMADO)
                    ? COLOR_VERDE : COLOR_ACENTO;

            Table subBanner = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth().setMarginBottom(18);
            subBanner.addCell(new Cell()
                    .add(new Paragraph("Partido #" + partido.getId())
                            .setFont(fBold).setFontSize(10).setFontColor(COLOR_TEXTO_MUTED))
                    .setBorder(Border.NO_BORDER).setBackgroundColor(COLOR_GRIS_CLARO)
                    .setPaddingLeft(10).setPaddingTop(7).setPaddingBottom(7));
            subBanner.addCell(new Cell()
                    .add(new Paragraph("Estado: " + estadoTexto)
                            .setFont(fBold).setFontSize(10).setFontColor(colorEstado)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER).setBackgroundColor(COLOR_GRIS_CLARO)
                    .setPaddingRight(10).setPaddingTop(7).setPaddingBottom(7));
            document.add(subBanner);

            // 2. MARCADOR CENTRAL
            String localNombre     = partido.getLocal()     != null ? partido.getLocal().getNombre()     : "Local";
            String visitanteNombre = partido.getVisitante() != null ? partido.getVisitante().getNombre() : "Visitante";
            String scoreLocal      = partido.getGolesLocal()     != null ? String.valueOf(partido.getGolesLocal())     : "—";
            String scoreVisitante  = partido.getGolesVisitante() != null ? String.valueOf(partido.getGolesVisitante()) : "—";

            Table scoreTable = new Table(UnitValue.createPercentArray(new float[]{30, 40, 30}))
                    .useAllAvailableWidth().setMarginBottom(4);

            // Columna local — texto a la derecha
            scoreTable.addCell(new Cell()
                    .add(new Paragraph(localNombre)
                            .setFont(fBold).setFontSize(13).setFontColor(COLOR_TEXTO_OSCURO)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("LOCAL")
                            .setFont(fRegular).setFontSize(7).setFontColor(COLOR_TEXTO_MUTED)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER)
                    .setPadding(14)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE));

            // Columna marcador — fondo azul, resultado grande y centrado
            scoreTable.addCell(new Cell()
                    .add(new Paragraph(scoreLocal + "  —  " + scoreVisitante)
                            .setFont(fBold).setFontSize(28).setFontColor(COLOR_BLANCO)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(COLOR_PRIMARIO)
                    .setBorder(Border.NO_BORDER)
                    .setPadding(14)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE));

            // Columna visitante  — texto a la izquierda
            scoreTable.addCell(new Cell()
                    .add(new Paragraph(visitanteNombre)
                            .setFont(fBold).setFontSize(13).setFontColor(COLOR_TEXTO_OSCURO)
                            .setTextAlignment(TextAlignment.LEFT))
                    .add(new Paragraph("VISITANTE")
                            .setFont(fRegular).setFontSize(7).setFontColor(COLOR_TEXTO_MUTED)
                            .setTextAlignment(TextAlignment.LEFT))
                    .setBorder(Border.NO_BORDER)
                    .setPadding(14)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE));

            document.add(scoreTable);

            document.add(new Paragraph()
                    .setBorderBottom(new SolidBorder(COLOR_ACENTO, 2))
                    .setMarginBottom(14));

            // 3. TABLA DE DETALLES 
            document.add(new Paragraph("DATOS DEL ENCUENTRO")
                    .setFont(fBold).setFontSize(9).setFontColor(COLOR_TEXTO_MUTED)
                    .setMarginBottom(6));

            Table detalles = new Table(UnitValue.createPercentArray(new float[]{22, 28, 22, 28}))
                    .useAllAvailableWidth().setMarginBottom(18);

            addCeldaCabecera(detalles, fBold, "JORNADA");
            addCeldaValor(detalles, fRegular,
                    partido.getJornada() != null ? "Jornada " + partido.getJornada() : "—");
            addCeldaCabecera(detalles, fBold, "TIPO");
            addCeldaValor(detalles, fRegular,
                    partido.getTipoPartido() != null ? partido.getTipoPartido().name() : "REGULAR");

            addCeldaCabecera(detalles, fBold, "FECHA");
            addCeldaValor(detalles, fRegular,
                    partido.getFecha() != null ? partido.getFecha() : "—");
            addCeldaCabecera(detalles, fBold, "LIGA");
            addCeldaValor(detalles, fRegular,
                    partido.getLigaId() != null ? "#" + partido.getLigaId() : "—");

            document.add(detalles);

            // 4. INCIDENCIAS / ESTADÍSTICAS
            document.add(new Paragraph()
                    .setBorderBottom(new SolidBorder(COLOR_GRIS_CLARO, 1))
                    .setMarginBottom(10));
            document.add(new Paragraph("INCIDENCIAS Y ESTADÍSTICAS")
                    .setFont(fBold).setFontSize(9).setFontColor(COLOR_TEXTO_MUTED)
                    .setMarginBottom(8));

            Table incidencias = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                    .useAllAvailableWidth().setMarginBottom(24);

            incidencias.addHeaderCell(new Cell()
                    .add(new Paragraph("JUGADOR / DESCRIPCIÓN")
                            .setFont(fBold).setFontSize(9).setFontColor(COLOR_BLANCO))
                    .setBackgroundColor(COLOR_PRIMARIO).setBorder(Border.NO_BORDER).setPadding(8));
            incidencias.addHeaderCell(new Cell()
                    .add(new Paragraph("ACCIÓN / PUNTOS")
                            .setFont(fBold).setFontSize(9).setFontColor(COLOR_BLANCO))
                    .setBackgroundColor(COLOR_PRIMARIO).setBorder(Border.NO_BORDER).setPadding(8));

            String goleadoresRaw = partido.getGoleadores();
            if (goleadoresRaw != null && !goleadoresRaw.isBlank()) {
                boolean filaPar = false;
                for (String linea : goleadoresRaw.split("\n")) {
                    if (linea.isBlank()) continue;
                    DeviceRgb filaBg = filaPar ? COLOR_GRIS_CLARO : COLOR_BLANCO;
                    String[] partes  = linea.split(" - ", 2);
                    String jugador   = partes[0].trim();
                    String accion    = partes.length > 1 ? partes[1].trim() : "Incidencia";

                    incidencias.addCell(new Cell()
                            .add(new Paragraph(jugador)
                                    .setFont(fRegular).setFontSize(10).setFontColor(COLOR_TEXTO_OSCURO))
                            .setBackgroundColor(filaBg)
                            .setBorder(new SolidBorder(COLOR_BORDE_SUAVE, 0.5f)).setPadding(8));
                    incidencias.addCell(new Cell()
                            .add(new Paragraph(accion)
                                    .setFont(fBold).setFontSize(10).setFontColor(COLOR_ACENTO))
                            .setBackgroundColor(filaBg)
                            .setBorder(new SolidBorder(COLOR_BORDE_SUAVE, 0.5f)).setPadding(8));
                    filaPar = !filaPar;
                }
            } else {
                incidencias.addCell(new Cell(1, 2)
                        .add(new Paragraph("Sin incidencias registradas.")
                                .setFont(fRegular).setFontSize(10).setFontColor(COLOR_TEXTO_MUTED)
                                .setTextAlignment(TextAlignment.CENTER))
                        .setBorder(Border.NO_BORDER).setPadding(14));
            }
            document.add(incidencias);

            //  5. SECCIÓN DE FIRMAS
            document.add(new Paragraph("FIRMAS OFICIALES")
                    .setFont(fBold).setFontSize(9).setFontColor(COLOR_TEXTO_MUTED)
                    .setMarginTop(8).setMarginBottom(0));

            // Espacio en blanco para escribir las firmas
            document.add(new Paragraph("\n\n\n\n").setFont(fRegular).setFontSize(14));

            Table firmas = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                    .useAllAvailableWidth().setMarginBottom(10);
            firmas.addCell(celdaFirma(fBold, fRegular, "Árbitro"));
            firmas.addCell(celdaFirma(fBold, fRegular, "Capitán Local"));
            firmas.addCell(celdaFirma(fBold, fRegular, "Capitán Visitante"));
            document.add(firmas);

            // 6. PIE DE PÁGINA
            document.add(new Paragraph()
                    .setBorderTop(new SolidBorder(COLOR_GRIS_CLARO, 1))
                    .setMarginTop(14).setMarginBottom(6));
            document.add(new Paragraph(
                    "Documento generado automáticamente por LigaSync · " + LocalDate.now())
                    .setFont(fRegular).setFontSize(8).setFontColor(COLOR_TEXTO_MUTED)
                    .setTextAlignment(TextAlignment.CENTER));

            document.close();
        } catch (IOException e) {
            throw new RuntimeException("Error al generar el acta PDF del partido " + partido.getId(), e);
        }
        return out.toByteArray();
    }

    // Helpers

    private void addCeldaCabecera(Table table, PdfFont font, String texto) {
        table.addCell(new Cell()
                .add(new Paragraph(texto).setFont(font).setFontSize(9).setFontColor(COLOR_PRIMARIO))
                .setBackgroundColor(COLOR_CABECERA_BG)
                .setBorder(new SolidBorder(new DeviceRgb(219, 234, 254), 0.5f))
                .setPadding(8));
    }

    private void addCeldaValor(Table table, PdfFont font, String texto) {
        table.addCell(new Cell()
                .add(new Paragraph(texto).setFont(font).setFontSize(10).setFontColor(COLOR_TEXTO_OSCURO))
                .setBorder(new SolidBorder(COLOR_BORDE_SUAVE, 0.5f))
                .setPadding(8));
    }

    // Celda de firma: borde superior como línea de firma, rol y campo nombre debajo
    private Cell celdaFirma(PdfFont fBold, PdfFont fRegular, String rol) {
        return new Cell()
                .add(new Paragraph("Firma " + rol)
                        .setFont(fBold).setFontSize(10).setFontColor(COLOR_TEXTO_OSCURO)
                        .setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("Nombre y DNI: ___________________")
                        .setFont(fRegular).setFontSize(8).setFontColor(COLOR_TEXTO_MUTED)
                        .setTextAlignment(TextAlignment.CENTER).setMarginTop(4))
                .setBorder(Border.NO_BORDER)
                .setBorderTop(new SolidBorder(COLOR_TEXTO_OSCURO, 1.5f))
                .setPaddingTop(8).setPaddingBottom(8)
                .setPaddingLeft(10).setPaddingRight(10);
    }
}
