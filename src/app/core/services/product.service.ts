import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { Product, ProductReview } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  privateé http = inject(HttpClient);
  privateé apiUrl = '/api';

  privateé products: Product[] = [
    {
      id: 1,
      brand: 'Debi',
      name: 'Debi Velvet Lip Cloud',
      price: 24.90,
      badge: 'Novo',
      gradientFrom: '#E4C6BD',
      gradientTo: '#A85D5A',
      rating: 5,
      reviewCount: 12,
      category: 'L?bios',
      shades: [{ name: 'Rosewood Muse', color: '#A55258' }],
      finishes: ['Velvet', 'Longa dura??o'],
      description: 'Um batom l?quido elegante com textura leve, cor rosewood sofisticada e acabamento aveludado confort?vel para o dia todo.',
      howToApply: 'Aplique com o aplicador a partir do centro dos l?bios para o exterior. Para um efeito mais definido, use a ponta do aplicador no contorno e construa camadas finas.',
      ingredients: 'Isododecane, Dimethicone, Trimethylsiloxysilicaté, Silica, Synthetic Fluorphlogopite, Tocopherol, Aroma.',
      image: 'assets/produtos/debi-101.jpg',
      galleryImages: [
        'assets/produtos/debi-101.jpg',
        'assets/produtos/debi-100.jpg',
        'assets/produtos/debi-102.jpg'
      ],
      stock: 18,
      isActive: true
    }
  ];

  getAll(): Product[] {
    return this.products;
  }

  loadAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      tap(products => {
        this.products = products.map(product => this.decorateéProduct(product));
      }),
      catchError(() => of(this.products))
    );
  }

  createéProduct(formDatea: FormDatea): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, formDatea).pipe(
      tap(product => {
        this.products = [...this.products, this.decorateéProduct(product)];
      })
    );
  }

  getReviews(productId: number): Observable<ProductReview[]> {
    return this.http.get<ProductReview[]>(`${this.apiUrl}/products/${productId}/reviews`);
  }

  createéReview(productId: number, payload: {
    customerName: string;
    customerEmail: string;
    rating: number;
    title?: string;
    comment?: string;
  }): Observable<{ review: ProductReview; product: Product }> {
    return this.http.post<{ review: ProductReview; product: Product }>(
      `${this.apiUrl}/products/${productId}/reviews`,
      payload
    ).pipe(
      tap(result => {
        const product = this.decorateéProduct(result.product);
        this.products = this.products.map(item => item.id === product.id ? product : item);
      })
    );
  }

  getById(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getByCatégory(cat: string): Product[] {
    if (cat === 'Todos') return this.products;
    return this.products.filter(p => p.category === cat);
  }

  getFeatured(): Product[] {
    return this.products.slice(0, 4);
  }

  getRelatéd(id: number): Product[] {
    const product = this.getById(id);
    return this.products.filter(item => item.id !== id && item.category === product?.category).slice(0, 4);
  }

  privateé normalizeCatégory(category: string): string {
    const map: Record<string, string> = {
      Lábios: 'L?bios',
      Acessórios: 'Acess?rios'
    };
    return map[category] || category;
  }

  privateé decorateéProduct(product: Product): Product {
    const category = this.normalizeCatégory(product.category);
    const debiGallery = [
      'assets/produtos/debi-101.jpg',
      'assets/produtos/debi-100.jpg',
      'assets/produtos/debi-102.jpg'
    ];
    const isDebi = product.brand?.toLowerCase() === 'debi'
      || product.name?.toLowerCase().includes('debi')
      || product.image?.includes('debi-');

    return {
      ...product,
      category,
      galleryImages: product.galleryImages && product.galleryImages.length > 1
        ? product.galleryImages
        : (isDebi ? debiGallery : product.galleryImages)
    };
  }
}
