package LigaSync.API.controller;

import LigaSync.API.model.Equipo;
import LigaSync.API.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    @Autowired
    private EquipoRepository equipoRepository;

    // Obtener todos los equipos
    @GetMapping
    public List<Equipo> obtenerEquipos() {
        return equipoRepository.findAll();
    }

    // Crear un nuevo equipo
    @PostMapping
    public Equipo crearEquipo(@RequestBody Equipo nuevoEquipo) {
        return equipoRepository.save(nuevoEquipo);
    }
    // Editar un equipo existente
    @PutMapping("/{id}")
    public Equipo actualizarEquipo(@PathVariable Long id, @RequestBody Equipo equipoActualizado) {
        return equipoRepository.findById(id).map(equipo -> {
            equipo.setNombre(equipoActualizado.getNombre());
            equipo.setCiudad(equipoActualizado.getCiudad());
            // Si quieres actualizar más campos (escudo, etc.), agrégalos aquí
            return equipoRepository.save(equipo);
        }).orElseThrow(() -> new RuntimeException("Equipo no encontrado"));
    }

    // Eliminar un equipo
    @DeleteMapping("/{id}")
    public void eliminarEquipo(@PathVariable Long id) {
        equipoRepository.deleteById(id);
    }
}