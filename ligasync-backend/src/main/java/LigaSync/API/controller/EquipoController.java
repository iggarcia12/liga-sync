package LigaSync.API.controller;

import LigaSync.API.model.Equipo;
import LigaSync.API.repository.EquipoRepository;
import LigaSync.API.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    @Autowired
    private EquipoRepository equipoRepository;

    @GetMapping
    public List<Equipo> obtenerEquipos() {
        return equipoRepository.findByLigaId(SecurityUtils.getLigaId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipo> obtenerEquipoPorId(@PathVariable Long id) {
        Long ligaId = SecurityUtils.getLigaId();
        return equipoRepository.findById(id)
                .filter(e -> ligaId.equals(e.getLigaId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Equipo crearEquipo(@RequestBody Equipo nuevoEquipo) {
        nuevoEquipo.setLigaId(SecurityUtils.getLigaId());
        return equipoRepository.save(nuevoEquipo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarEquipo(@PathVariable Long id, @RequestBody Equipo equipoActualizado) {
        Long ligaId = SecurityUtils.getLigaId();
        return equipoRepository.findById(id)
                .filter(e -> ligaId.equals(e.getLigaId()))
                .map(equipo -> {
                    equipo.setNombre(equipoActualizado.getNombre());
                    equipo.setCiudad(equipoActualizado.getCiudad());
                    equipo.setEscudo(equipoActualizado.getEscudo());
                    return ResponseEntity.ok(equipoRepository.save(equipo));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/pagar-deuda")
    public ResponseEntity<?> pagarDeuda(@PathVariable Long id) {
        Long ligaId = SecurityUtils.getLigaId();
        return equipoRepository.findById(id)
                .filter(e -> ligaId.equals(e.getLigaId()))
                .map(equipo -> {
                    double deuda = equipo.getDeudaAcumulada() != null ? equipo.getDeudaAcumulada() : 0.0;
                    if (deuda <= 0) {
                        return ResponseEntity.badRequest().body("Este equipo no tiene deuda pendiente.");
                    }
                    int presupuesto = equipo.getPresupuesto() != null ? equipo.getPresupuesto() : 0;
                    if (presupuesto < deuda) {
                        return ResponseEntity.badRequest().body(
                            "Presupuesto insuficiente. Necesitas " + (int) deuda + " € pero solo tienes " + presupuesto + " €."
                        );
                    }
                    equipo.setPresupuesto(presupuesto - (int) deuda);
                    equipo.setDeudaAcumulada(0.0);
                    return ResponseEntity.ok(equipoRepository.save(equipo));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarEquipo(@PathVariable Long id) {
        Long ligaId = SecurityUtils.getLigaId();
        return equipoRepository.findById(id)
                .filter(e -> ligaId.equals(e.getLigaId()))
                .map(e -> {
                    equipoRepository.delete(e);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
