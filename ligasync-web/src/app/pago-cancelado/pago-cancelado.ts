import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pago-cancelado',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './pago-cancelado.html',
  styleUrl: './pago-cancelado.css'
})
export class PagoCanceladoComponent {}
