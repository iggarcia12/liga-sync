package LigaSync.API.config;

import LigaSync.API.model.Equipo;
import LigaSync.API.model.Partido;
import LigaSync.API.repository.EquipoRepository;
import LigaSync.API.repository.PartidoRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataFixer {

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private PartidoRepository partidoRepository;

    @PostConstruct
    public void fixClassification() {
        System.out.println("[DataFixer] Recalculando clasificación al inicio...");
        List<Equipo> equipos = equipoRepository.findAll();
        List<Partido> partidos = partidoRepository.findAll();

        // Usamos un mapa por ID para garantizar que siempre modificamos
        // las mismas instancias que luego guardamos con saveAll(equipos)
        Map<Long, Equipo> equipoMap = new HashMap<>();
        for (Equipo e : equipos) {
            e.setPts(0); e.setPj(0); e.setPg(0); e.setPe(0); e.setPp(0); e.setGf(0); e.setGc(0);
            equipoMap.put(e.getId(), e);
        }

        for (Partido p : partidos) {
            if (p.getGolesLocal() == null || p.getGolesVisitante() == null) continue;

            Equipo local = p.getLocal() != null ? equipoMap.get(p.getLocal().getId()) : null;
            Equipo visitante = p.getVisitante() != null ? equipoMap.get(p.getVisitante().getId()) : null;
            int gL = p.getGolesLocal();
            int gV = p.getGolesVisitante();

            if (local != null) {
                local.setPj(local.getPj() + 1);
                local.setGf(local.getGf() + gL);
                local.setGc(local.getGc() + gV);
                if (gL > gV) {
                    local.setPg(local.getPg() + 1);
                    local.setPts(local.getPts() + 3);
                } else if (gL == gV) {
                    local.setPe(local.getPe() + 1);
                    local.setPts(local.getPts() + 1);
                } else {
                    local.setPp(local.getPp() + 1);
                }
            }

            if (visitante != null) {
                visitante.setPj(visitante.getPj() + 1);
                visitante.setGf(visitante.getGf() + gV);
                visitante.setGc(visitante.getGc() + gL);
                if (gV > gL) {
                    visitante.setPg(visitante.getPg() + 1);
                    visitante.setPts(visitante.getPts() + 3);
                } else if (gV == gL) {
                    visitante.setPe(visitante.getPe() + 1);
                    visitante.setPts(visitante.getPts() + 1);
                } else {
                    visitante.setPp(visitante.getPp() + 1);
                }
            }
        }
        equipoRepository.saveAll(equipos);
        System.out.println("[DataFixer] Clasificación recalculada con éxito.");
    }
}
