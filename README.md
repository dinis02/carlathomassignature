# Carla Thomas Signature — Angular App

Aplicação Angular 17 standalone com todas as páginas da loja.

## Estrutura

```
src/app/
├── core/
│   ├── models/models.ts          # Interfaces: Product, CartItem, Order
│   └── services/
│       ├── product.service.ts    # Catálogo de produtos (mock data)
│       └── cart.service.ts       # Estado do carrinho (Angular signals)
├── shared/
│   └── components/
│       ├── header/               # Header sticky com contador de carrinho
│       ├── footer/               # Footer com navegação
│       └── cursor/               # Cursor rose gold personalizado
└── pages/
    ├── home/                     # Homepage com hero, categorias, destaques
    ├── products/                 # Listagem com filtros, ordenação, grid/lista
    ├── product-detail/           # Detalhe com galeria, variantes, accordeon
    ├── cart/                     # Carrinho com cupões e resumo
    ├── checkout/                 # Formulário de entrega + pagamento
    └── confirmation/             # Página de confirmação de encomenda
```

## Rotas

| Path              | Página                |
|-------------------|-----------------------|
| `/`               | Homepage              |
| `/produtos`       | Listagem de produtos  |
| `/produtos?cat=X` | Filtrado por categoria|
| `/produto/:id`    | Detalhe do produto    |
| `/carrinho`       | Carrinho              |
| `/checkout`       | Checkout              |
| `/confirmacao`    | Confirmação           |

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
ng serve

# 3. Abrir no browser
# http://localhost:4200
```

## Build para produção

```bash
ng build
# Output em dist/carla-thomas-signature/
```

## Tecnologias

- **Angular 17** — Standalone components, Signals, Control flow (@if/@for)
- **Angular Router** — Lazy loading, view transitions
- **Reactive Forms** — Validação no checkout
- **Angular Signals** — Estado do carrinho reactivo sem NgRx
- **SCSS** — Estilos por componente + global design system

## Design System

Variáveis CSS globais em `src/styles.scss`:

```css
--creme:      #F7F4F0
--creme-dark: #EDE8E1
--noir:       #1A1714
--rose-gold:  #C9956A
--text-muted: #8A7E74
```

Fontes: **Cormorant Garamond** (serif, títulos) + **Jost** (sans-serif, corpo)

## Adicionar produtos reais

Editar `src/app/core/services/product.service.ts` — array `products[]`.
Substituir `gradientFrom`/`gradientTo` pelo path da imagem quando tiver assets reais.

## Cupões de teste

- `CARLA10` — 10% de desconto
- `REWARDS` — 10% de desconto
