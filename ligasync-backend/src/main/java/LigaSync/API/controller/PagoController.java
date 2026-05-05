package LigaSync.API.controller;

import LigaSync.API.dto.PagoRequest;
import LigaSync.API.repository.EquipoRepository;
import LigaSync.API.service.StripeService;
import com.stripe.exception.StripeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    @Autowired
    private StripeService stripeService;

    @Autowired
    private EquipoRepository equipoRepository;

    @PostMapping("/crear-sesion")
    public ResponseEntity<?> crearSesionPago(@RequestBody PagoRequest request) {
        try {
            String url = stripeService.createCheckoutSession(
                    request.getEquipoId(),
                    request.getNombreEquipo(),
                    request.getPrecioCentimos()
            );
            return ResponseEntity.ok(Map.of("url", url));
        } catch (StripeException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error al conectar con Stripe: " + e.getMessage()));
        }
    }

    @PatchMapping("/confirmar-cuota/{equipoId}")
    public ResponseEntity<?> confirmarCuota(@PathVariable Long equipoId) {
        return equipoRepository.findById(equipoId)
                .map(equipo -> {
                    equipo.setCuotaPagada(true);
                    return ResponseEntity.ok(equipoRepository.save(equipo));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/resetear-cuota/{equipoId}")
    public ResponseEntity<?> resetearCuota(@PathVariable Long equipoId) {
        return equipoRepository.findById(equipoId)
                .map(equipo -> {
                    equipo.setCuotaPagada(false);
                    return ResponseEntity.ok(equipoRepository.save(equipo));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
