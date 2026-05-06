import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pago-exito',
  standalone: true,
  imports: [RouterLink, CommonModule, TranslateModule],
  templateUrl: './pago-exito.html',
  styleUrl: './pago-exito.css'
})
export class PagoExitoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  confirmando = true;
  error = false;

  ngOnInit() {
    const equipoId = this.route.snapshot.queryParamMap.get('equipoId');
    console.log('[PagoExito] equipoId recibido:', equipoId);
    if (!equipoId) { 
      this.confirmando = false; 
      this.cdr.detectChanges();
      return; 
    }

    this.http.patch(`${environment.apiUrl}/api/pagos/confirmar-cuota/${equipoId}`, {}).subscribe({
      next: (resp) => {
        console.log('[PagoExito] Cuota confirmada correctamente:', resp);
        this.confirmando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[PagoExito] Error al confirmar cuota (status ' + err.status + '):', err);
        this.confirmando = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }
}
