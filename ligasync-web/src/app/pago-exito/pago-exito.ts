import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pago-exito',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './pago-exito.html',
  styleUrl: './pago-exito.css'
})
export class PagoExitoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  confirmando = true;
  error = false;

  ngOnInit() {
    const equipoId = this.route.snapshot.queryParamMap.get('equipoId');
    console.log('[PagoExito] equipoId recibido:', equipoId);
    if (!equipoId) { this.confirmando = false; return; }

    this.http.patch(`http://localhost:8080/api/pagos/confirmar-cuota/${equipoId}`, {}).subscribe({
      next: (resp) => {
        console.log('[PagoExito] Cuota confirmada correctamente:', resp);
        this.confirmando = false;
      },
      error: (err) => {
        console.error('[PagoExito] Error al confirmar cuota (status ' + err.status + '):', err);
        this.confirmando = false;
        this.error = true;
      }
    });
  }
}
