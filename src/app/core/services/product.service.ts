import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { Product } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  private products: Product[] = [
    {
      id: 1, brand: 'Charlotte Tilbury', name: 'Pillow Talk Lipstick',
      price: 33.60, originalPrice: 42.00, badge: '-20%', badgeDark: true,
      gradientFrom: '#C9A08A', gradientTo: '#A07050',
      rating: 4.2, reviewCount: 184, category: 'Lábios',
      shades: [
        { name: 'Pillow Talk', color: '#C9956A' },
        { name: 'Coral Bliss', color: '#D4806A' },
        { name: 'Berry Kiss', color: '#8B3A5A' },
        { name: 'Rouge Red', color: '#B02A2A' },
        { name: 'Mocha Rose', color: '#7A4A3A' },
        { name: 'Dusty Pink', color: '#D4A0A8' }
      ],
      finishes: ['Matte', 'Acetinado', 'Brilhante'],
      description: 'O batom mais icónico da Charlotte Tilbury — uma tonalidade nude-rosa universal que assenta em todos os tons de pele. A fórmula exclusiva com ácido hialurónico e vitamina E proporciona hidratação duradoura enquanto a cor se mantém intensa.',
      howToApply: 'Comece pelos lábios limpos e hidratados. Aplique o lápis Pillow Talk Liner para definir o contorno. Preencha com o batom em movimentos suaves do centro para o exterior.',
      ingredients: 'Ricinus Communis Seed Oil, Ozokerite, Candelilla Cera, Polybutene, Bis-Diglyceryl Polyacyladipate-2, Tocopheryl Acetate (Vitamina E), Hyaluronic Acid.',
      image: 'assets/produtos/pillow-talk-lipstick.jpg'
    },
    {
      id: 2, brand: 'Charlotte Tilbury', name: 'Pillow Talk Lip Liner',
      price: 18.00,
      gradientFrom: '#2A2220', gradientTo: '#1A1714',
      rating: 4.8, reviewCount: 248, category: 'Lábios',
      badge: 'Novo',
      shades: [
        { name: 'Pillow Talk', color: '#C9956A' },
        { name: 'Medium', color: '#A07050' }
      ],
      finishes: ['Clássico'],
      description: 'O lápis de lábios mais icónico do mundo, numa tonalidade nude-rosa universal.',
      image: 'assets/produtos/pillow-talk-lip-liner.jpg'
    },
    {
      id: 3, brand: 'Carla Thomas', name: 'Rosé Glow Lip Gloss',
      price: 28.00, badge: 'Exclusivo',
      gradientFrom: '#E8D0C0', gradientTo: '#D4B8A8',
      rating: 5.0, reviewCount: 312, category: 'Lábios',
      shades: [
        { name: 'Rosé Gold', color: '#C9956A' },
        { name: 'Champagne', color: '#E8C4A8' }
      ],
      finishes: ['Brilhante'],
      description: 'O nosso gloss exclusivo com efeito volume e tonalidade rosé dourada inigualável.',
      image: 'assets/produtos/rose-glow-lip-gloss.jpg'
    },
    {
      id: 4, brand: 'NARS', name: 'Afterglow Lip Balm',
      price: 26.00,
      gradientFrom: '#D4C4B5', gradientTo: '#C4B0A0',
      rating: 4.1, reviewCount: 97, category: 'Lábios',
      shades: [
        { name: 'Nude', color: '#C9956A' },
        { name: 'Rosa', color: '#E8B4B8' }
      ],
      finishes: ['Hidratante'],
      description: 'Bálsamo nutritivo com cor subtil e brilho natural para lábios hidratados.',
      image: 'assets/produtos/afterglow-lip-balm.jpg'
    },
    {
      id: 5, brand: 'La Mer', name: 'Crème de la Mer',
      price: 185.00,
      gradientFrom: '#C4B0A0', gradientTo: '#B09080',
      rating: 4.6, reviewCount: 203, category: 'Rosto',
      description: 'A crème lendária que revolucionou a skincare de luxo.'
    },
    {
      id: 6, brand: 'Dior Beauty', name: 'Rouge Dior Satin',
      price: 39.00,
      gradientFrom: '#3A302C', gradientTo: '#2A2220',
      rating: 4.3, reviewCount: 156, category: 'Lábios',
      shades: [
        { name: 'Rouge', color: '#B02A2A' },
        { name: 'Rose', color: '#D4A0A8' }
      ],
      finishes: ['Acetinado'],
      description: 'Textura sedosa com acabamento acetinado e durabilidade excepcional.'
    },
    {
      id: 7, brand: 'Armani Beauty', name: 'Lip Maestro Velvet',
      price: 38.00,
      gradientFrom: '#B8A898', gradientTo: '#A09080',
      rating: 3.9, reviewCount: 67, category: 'Lábios',
      description: 'Batom líquido de acabamento aveludado com intensidade total.',
    },
    {
      id: 8, brand: 'Charlotte Tilbury', name: 'Matte Revolution',
      price: 44.00, badge: 'Novo',
      gradientFrom: '#E8C4B0', gradientTo: '#D4A890',
      rating: 4.9, reviewCount: 89, category: 'Lábios',
      shades: [
        { name: 'Pillow Talk', color: '#C9956A' },
        { name: 'Very Victoria', color: '#D4806A' }
      ],
      finishes: ['Matte'],
      description: 'Fórmula matte revolucionária com ácido hialurónico para lábios hidratados.'
    },
    {
      id: 9, brand: 'NARS', name: 'Velvet Lip Glide',
      price: 27.20, originalPrice: 32.00, badge: '-15%', badgeDark: true,
      gradientFrom: '#4A3030', gradientTo: '#3A2020',
      rating: 3.7, reviewCount: 43, category: 'Lábios',
      description: 'Acabamento líquido sedoso, cor ultra-pigmentada, fórmula que não resseca.'
    },
    {
      id: 10, brand: 'Charlotte Tilbury', name: 'Glowgasm Lips',
      price: 36.00,
      gradientFrom: '#F0E8E0', gradientTo: '#E0D4C4',
      rating: 4.8, reviewCount: 201, category: 'Lábios',
      description: 'Brilho multidimensional com partículas luminosas para lábios deslumbrantes.'
    },
    {
      id: 11, brand: 'Sana Jardin', name: 'Jaipur Chant No. 8',
      price: 89.00,
      gradientFrom: '#2A2418', gradientTo: '#1A1810',
      rating: 4.5, reviewCount: 128, category: 'Acessórios',
      description: 'Eau de Parfum com notas de especiarias e flores de jasmim.'
    },
    {
      id: 12, brand: 'Armani Beauty', name: 'Luminous Silk Foundation',
      price: 62.00,
      gradientFrom: '#D4C0A8', gradientTo: '#C4B098',
      rating: 4.7, reviewCount: 345, category: 'Rosto',
      description: 'A base sedosa de cobertura luminosa mais vendida do mundo.'
    }
  ];

  getAll(): Product[] { return this.products; }

  loadAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      tap(products => {
        this.products = products.map(product => ({
          ...product,
          category: this.normalizeCategory(product.category)
        }));
      }),
      catchError(() => of(this.products))
    );
  }

  createProduct(formData: FormData): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, formData).pipe(
      tap(product => {
        this.products = [
          ...this.products,
          { ...product, category: this.normalizeCategory(product.category) }
        ];
      })
    );
  }

  getById(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getByCategory(cat: string): Product[] {
    if (cat === 'Todos') return this.products;
    return this.products.filter(p => p.category === cat);
  }

  getFeatured(): Product[] { return this.products.slice(0, 4); }

  getRelated(id: number): Product[] {
    const p = this.getById(id);
    return this.products.filter(x => x.id !== id && x.category === p?.category).slice(0, 4);
  }

  private normalizeCategory(category: string): string {
    const map: Record<string, string> = {
      Labios: 'Lábios',
      Acessorios: 'Acessórios'
    };
    return map[category] || category;
  }
}
