import { Component, inject, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {
  private productSvc = inject(ProductService);
  private cartSvc    = inject(CartService);

  // Template bindings
  email: string = '';
  subscribed: boolean = false;
  featured: Product[] = [];

  marqueeItems = [
    'Maquilhagem de Luxo', 'Skincare Premium', 'Marcas Exclusivas',
    'Entrega em Portugal', 'Makeup Rewards', 'Novidades Semanais'
  ];

  categories = [
    { name: 'Maquilhagem', count: 142, featured: true,  gradient: 'linear-gradient(160deg,#2A2220,#1A1714)' },
    { name: 'Rosto',       count: 89,  featured: false, gradient: 'linear-gradient(160deg,#C9A08A,#A0705A)' },
    { name: 'Corpo',       count: 64,  featured: false, gradient: 'linear-gradient(160deg,#D4C4B5,#C0A898)' },
    { name: 'Cabelo',      count: 57,  featured: false, gradient: 'linear-gradient(160deg,#3A302C,#2A2220)' },
    { name: 'Acessórios',  count: 33,  featured: false, gradient: 'linear-gradient(160deg,#E8D4C0,#D4C0A8)' },
  ];

  brands = ['Charlotte Tilbury', 'La Mer', 'Sana Jardin', 'Dior Beauty', 'NARS', 'Armani Beauty'];

  constructor() {
    // Optionally load featured products from the service if available.
    try {
      const maybe = (this.productSvc as any).getFeatured?.();
      if (Array.isArray(maybe)) this.featured = maybe as Product[];
    } catch (e) {
      // ignore - leave featured empty
    }

    // If service didn't return featured products, provide safe sample data
    if (!this.featured || this.featured.length === 0) {
      this.featured = [
        { id: 1, brand: 'La Mer', name: 'The Revitalizing Serum', price: 350, originalPrice: 400, gradientFrom: '#C9956A', gradientTo: '#A07040', badge: 'Novo', badgeDark: true } as any,
        { id: 2, brand: 'Dior Beauty', name: 'Lip Glow', price: 38, gradientFrom: '#3A302C', gradientTo: '#2A2220' } as any,
        { id: 3, brand: 'NARS', name: 'Blush Orgasm', price: 32, gradientFrom: '#E8D4C0', gradientTo: '#D4C0A8', badge: 'Top' } as any,
      ];
    }
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) (e.target as Element).classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Cursor behavior is handled by the shared `app-cursor` component.
  }

  addToCart(e: Event, product: Product): void {
    e.preventDefault();
    e.stopPropagation();
    this.cartSvc.add(product);
  }

  subscribe(): void {
    if (this.email && this.email.trim().length) {
      // TODO: call newsletter API
      this.subscribed = true;
      this.email = '';
    }
  }
}
