package LigaSync.API.controller;

import LigaSync.API.model.Equipo;
import LigaSync.API.repository.EquipoRepository;
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
        return equipoRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipo> obtenerEquipoPorId(@PathVariable Long id) {
        return equipoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Equipo crearEquipo(@RequestBody Equipo nuevoEquipo) {
        return equipoRepository.save(nuevoEquipo);
    }

    @PutMapping("/{id}")
    public Equipo actualizarEquipo(@PathVariable Long id, @RequestBody Equipo equipoActualizado) {
        return equipoRepository.findById(id).map(equipo -> {
            equipo.setNombre(equipoActualizado.getNombre());
            equipo.setCiudad(equipoActualizado.getCiudad());
            equipo.setEscudo(equipoActualizado.getEscudo());
            return equipoRepository.save(equipo);
        }).orElseThrow(() -> new RuntimeException("Equipo no encontrado"));
    }

    @PutMapping("/{id}/pagar-deuda")
    public ResponseEntity<?> pagarDeuda(@PathVariable Long id) {
        return equipoRepository.findById(id).map(equipo -> {
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
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public void eliminarEquipo(@PathVariable Long id) {
        equipoRepository.deleteById(id);
    }
}