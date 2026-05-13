import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="legal-page">
      <div class="legal-shell">
        <a routerLink="/" class="back-link">Voltar a inicio</a>
        <h1>{{ title }}</h1>
        <p>{{ intro }}</p>
      </div>
    </section>
  `,
  styles: [`
    .legal-page { padding: 48px 20px; }
    .legal-shell { max-width: 860px; margin: 0 auto; }
    .back-link { text-decoration: none; color: #8c6a4a; font-weight: 600; }
    h1 { margin: 16px 0 8px; font-family: 'Cormorant Garamond', serif; font-size: 2rem; }
    p { margin: 0; color: #5f4f43; line-height: 1.7; }
  `]
})
export class LegalComponent {
  private route = inject(ActivatedRoute);

  get page(): string {
    return this.route.snapshot.data['page'] || 'terms';
  }

  get title(): string {
    if (this.page === 'privatecy') return 'Politica de Privacidade';
    if (this.page === 'cookies') return 'Politica de Cookies';
    return 'Termos e Condicoes';
  }

  get intro(): string {
    if (this.page === 'privatecy') return 'Aqui descrevemos como os seus dados sao recolhidos e protegidos.';
    if (this.page === 'cookies') return 'Aqui explicamos como os cookies sao usados para melhorar a experiencia no site.';
    return 'Aqui descrevemos os termos gerais de utilizacao e compra da loja.';
  }
}
