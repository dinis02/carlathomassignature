import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface LegalSection {
  title: string;
  body: string[];
}

interface LegalPage {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}

const CONTACT = 'geral@carlathomassignature.pt';

const PAGES: Record<string, LegalPage> = {
  privacy: {
    eyebrow: 'RGPD e dados pessoais',
    title: 'Politica de Privacidade',
    intro: 'Explicamos de forma clara como recolhemos, usamos e protegemos os seus dados pessoais na Carla Thomas Signature.',
    updated: '11 de Maio de 2026',
    sections: [
      {
        title: 'Responsavel pelo tratamento',
        body: [
          `A Carla Thomas Signature, associada ao dominio carlathomassignature.pt, e responsavel pelo tratamento dos dados pessoais recolhidos atraves deste website.`,
          `Para qualquer questao sobre privacidade ou exercicio de direitos, pode contactar-nos atraves de ${CONTACT}.`
        ]
      },
      {
        title: 'Dados que recolhemos',
        body: [
          'Podemos recolher nome, email, telefone, morada de entrega, codigo postal, cidade, pais, historico de encomendas, artigos comprados, wishlist, dados de conta e mensagens enviadas atraves dos nossos canais de contacto.',
          'Os dados de pagamento sao tratados de forma segura pela Stripe. A Carla Thomas Signature nao guarda dados completos de cartoes bancarios.'
        ]
      },
      {
        title: 'Finalidades',
        body: [
          'Usamos os dados para processar encomendas, gerir entregas, emitir comunicacoes transacionais, permitir acesso a area de cliente, guardar moradas, gerir pontos Makeup Rewards, responder a pedidos de apoio e cumprir obrigacoes legais.',
          'Tambem podemos usar o email para enviar novidades e campanhas apenas quando exista consentimento ou uma base legal valida.'
        ]
      },
      {
        title: 'Servicos externos',
        body: [
          'Utilizamos Supabase para autenticacao, base de dados e armazenamento tecnico, Stripe para pagamentos e um servico SMTP para envio de emails transacionais.',
          'Estes prestadores tratam dados apenas na medida necessaria para prestar os seus servicos e de acordo com as respetivas politicas de seguranca.'
        ]
      },
      {
        title: 'Conservacao dos dados',
        body: [
          'Guardamos os dados durante o periodo necessario para cumprir as finalidades descritas, incluindo prazos legais de faturacao, garantias, devolucoes e defesa de direitos.',
          'Dados de conta podem ser conservados enquanto a conta estiver ativa ou ate ser pedido o seu apagamento, quando legalmente possivel.'
        ]
      },
      {
        title: 'Os seus direitos',
        body: [
          'Pode pedir acesso, retificacao, apagamento, limitacao, portabilidade ou oposicao ao tratamento dos seus dados pessoais.',
          `Para exercer estes direitos, contacte ${CONTACT}. Tambem pode apresentar reclamacao junto da CNPD se considerar que os seus direitos nao foram respeitados.`
        ]
      }
    ]
  },
  cookies: {
    eyebrow: 'Cookies e tecnologias',
    title: 'Politica de Cookies',
    intro: 'Esta pagina explica que cookies e tecnologias semelhantes podem ser usados para o funcionamento seguro da loja.',
    updated: '11 de Maio de 2026',
    sections: [
      {
        title: 'O que sao cookies',
        body: [
          'Cookies sao pequenos ficheiros guardados no navegador para permitir funcionalidades essenciais, melhorar a seguranca e manter preferencias durante a navegacao.',
          'Tambem podem existir tecnologias semelhantes, como armazenamento local do navegador, usadas para carrinho, sessao ou preferencias.'
        ]
      },
      {
        title: 'Cookies essenciais',
        body: [
          'Usamos cookies e armazenamento tecnico necessarios para manter a sessao de login, proteger a autenticacao, guardar o carrinho e permitir que o checkout funcione corretamente.',
          'Estes cookies sao necessarios para prestar o servico pedido e nao requerem consentimento previo.'
        ]
      },
      {
        title: 'Pagamentos e autenticacao',
        body: [
          'A Stripe pode usar cookies e tecnologias proprias durante o processo de pagamento seguro.',
          'O Supabase pode usar armazenamento de sessao para manter o utilizador autenticado na area de cliente.'
        ]
      },
      {
        title: 'Cookies opcionais',
        body: [
          'Neste momento, o site nao depende de cookies de publicidade comportamental.',
          'Se no futuro forem adicionadas ferramentas de analytics, marketing ou publicidade, esta politica sera atualizada e sera pedido consentimento quando necessario.'
        ]
      },
      {
        title: 'Como gerir cookies',
        body: [
          'Pode apagar ou bloquear cookies nas definicoes do seu navegador. No entanto, algumas funcionalidades essenciais, como login, carrinho e checkout, podem deixar de funcionar corretamente.',
          `Para duvidas sobre cookies, contacte ${CONTACT}.`
        ]
      }
    ]
  },
  terms: {
    eyebrow: 'Condicoes de utilizacao',
    title: 'Termos e Condicoes',
    intro: 'Ao usar este website e realizar compras na Carla Thomas Signature, aceita os termos abaixo descritos.',
    updated: '11 de Maio de 2026',
    sections: [
      {
        title: 'Objeto',
        body: [
          'A Carla Thomas Signature disponibiliza uma loja online de produtos de beleza, skincare, cabelo, corpo e acessorios.',
          'Estes termos regulam o acesso ao website, a criacao de conta, a compra de produtos, pagamentos, entregas, devolucoes e utilizacao da area de cliente.'
        ]
      },
      {
        title: 'Produtos e precos',
        body: [
          'Apresentamos os produtos com a maior precisao possivel, incluindo nome, marca, preco, descricao e imagens.',
          'Os precos estao em euros e podem ser alterados sem aviso previo. O preco valido e o apresentado no momento da encomenda.'
        ]
      },
      {
        title: 'Encomendas e pagamento',
        body: [
          'A encomenda e considerada registada apos confirmacao dos dados e inicio do processo de pagamento.',
          'Os pagamentos por cartao sao processados de forma segura pela Stripe. A confirmacao da encomenda depende da validacao do pagamento.'
        ]
      },
      {
        title: 'Entrega',
        body: [
          'As entregas sao realizadas para a morada indicada pelo cliente no checkout.',
          'Os prazos apresentados sao estimativas e podem variar por motivos logisticos, operacionais ou externos a Carla Thomas Signature.'
        ]
      },
      {
        title: 'Devolucoes e cancelamentos',
        body: [
          'O cliente pode solicitar devolucao de acordo com a legislacao aplicavel e as condicoes indicadas no website.',
          'Produtos usados, danificados por manuseamento indevido ou sem condicoes de higiene podem nao ser aceites para devolucao, quando legalmente aplicavel.'
        ]
      },
      {
        title: 'Conta de cliente',
        body: [
          'O cliente e responsavel por manter os dados da conta atualizados e por proteger o acesso ao seu email e password.',
          'A area de cliente permite consultar encomendas, moradas, wishlist, pontos e dados associados a conta.'
        ]
      },
      {
        title: 'Contacto',
        body: [
          `Para apoio, questoes sobre encomendas ou exercicio de direitos, contacte ${CONTACT}.`,
          'Estes termos podem ser atualizados sempre que necessario, sendo a versao atual publicada nesta pagina.'
        ]
      }
    ]
  }
};

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="legal-page">
      <section class="legal-hero">
        <div class="breadcrumb">
          <a routerLink="/">Inicio</a>
          <span>-</span>
          <span>{{ page().title }}</span>
        </div>

        <div class="legal-heading">
          <div class="eyebrow">{{ page().eyebrow }}</div>
          <h1>{{ page().title }}</h1>
          <p>{{ page().intro }}</p>
          <span>Ultima atualizacao: {{ page().updated }}</span>
        </div>
      </section>

      <section class="legal-content">
        @for (section of page().sections; track section.title) {
          <article class="legal-section">
            <h2>{{ section.title }}</h2>
            @for (paragraph of section.body; track paragraph) {
              <p>{{ paragraph }}</p>
            }
          </article>
        }
      </section>
    </main>
  `,
  styles: [`
    .legal-page {
      background: var(--creme);
      color: var(--text);
      min-height: 70vh;
    }

    .legal-hero {
      padding: 64px 48px 48px;
      border-bottom: 1px solid var(--border);
    }

    .breadcrumb {
      max-width: 980px;
      margin: 0 auto 42px;
      display: flex;
      gap: 12px;
      align-items: center;
      font-size: 10px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .breadcrumb a {
      color: var(--text-muted);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      color: var(--rose-gold);
    }

    .legal-heading {
      max-width: 980px;
      margin: 0 auto;
    }

    .eyebrow {
      font-size: 10px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--rose-gold);
      margin-bottom: 18px;
    }

    h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(44px, 6vw, 82px);
      line-height: 0.95;
      font-weight: 300;
      margin: 0 0 24px;
    }

    .legal-heading p {
      max-width: 680px;
      color: var(--text-muted);
      font-size: 16px;
      line-height: 1.8;
      font-weight: 200;
      margin: 0 0 20px;
    }

    .legal-heading span {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--muted);
    }

    .legal-content {
      max-width: 980px;
      margin: 0 auto;
      padding: 56px 48px 110px;
      display: grid;
      gap: 28px;
    }

    .legal-section {
      background: var(--creme-dark);
      border: 1px solid var(--border);
      padding: 34px 38px;
    }

    .legal-section h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 30px;
      font-weight: 300;
      margin: 0 0 18px;
    }

    .legal-section p {
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.85;
      font-weight: 200;
      margin: 0 0 14px;
    }

    .legal-section p:last-child {
      margin-bottom: 0;
    }

    @media (max-width: 720px) {
      .legal-hero {
        padding: 44px 22px 34px;
      }

      .breadcrumb {
        margin-bottom: 32px;
        flex-wrap: wrap;
      }

      .legal-content {
        padding: 34px 22px 80px;
      }

      .legal-section {
        padding: 28px 22px;
      }

      .legal-section h2 {
        font-size: 26px;
      }
    }
  `]
})
export class LegalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly page = signal<LegalPage>(PAGES['privacy']);

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      const key = String(data['page'] || 'privacy');
      this.page.set(PAGES[key] || PAGES['privacy']);
    });
  }
}
