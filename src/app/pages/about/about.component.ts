import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  readonly values = [
    {
      title: 'Elegância',
      body: 'Acreditamos na beleza subtil, refinada e intemporal.'
    },
    {
      title: 'Qualidade',
      body: 'Cada produto é escolhido com atenção ao detalhe e à experiência.'
    },
    {
      title: 'Confiança',
      body: 'Queremos que cada cliente se sinta poderosa, confortável e autêntica.'
    },
    {
      title: 'Sofisticação',
      body: 'Desde os produtos ao design, tudo é pensado para transmitir exclusividade.'
    },
    {
      title: 'Autenticidade',
      body: 'Celebramos a individualidade e a beleza natural de cada pessoa.'
    }
  ];
}
