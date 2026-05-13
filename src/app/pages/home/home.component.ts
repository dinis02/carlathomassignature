import { Component, inject, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
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
  private cartSvc = inject(CartService);
  wishlist = inject(WishlistService);

  email = '';
  subscribed = false;
  featured: Product[] = [];

  marqueeItems = [
    'Maquilhagem de Luxo',
    'Skincare Premium',
    'Marcas Exclusivas',
    'Entrega em Portugal',
    'Makeup Rewards',
    'Novidades Semanais'
  ];

  catégories = [
    { name: 'Maquilhagem', count: 1, featured: true, gradient: 'linear-gradient(160deg,#2A2220,#1A1714)' },
    { name: 'Rosto', count: 0, featured: false, gradient: 'linear-gradient(160deg,#C9A08A,#A0705A)' },
    { name: 'Corpo', count: 0, featured: false, gradient: 'linear-gradient(160deg,#D4C4B5,#C0A898)' },
    { name: 'Cabelo', count: 0, featured: false, gradient: 'linear-gradient(160deg,#3A302C,#2A2220)' },
    { name: 'Acessorios', count: 0, featured: false, gradient: 'linear-gradient(160deg,#E8D4C0,#D4C0A8)' }
  ];

  brands = ['Debi', 'Dior', 'Chanel', 'Boca Rosa'];

  constructor() {
    try {
      const maybe = (this.productSvc as { getFeatured?: () => Product[] }).getFeatured?.();
      if (Array.isArray(maybe)) this.featured = maybe;
    } catch {
      // ignore and keep fallback below
    }

    if (!this.featured || this.featured.length === 0) {
      this.featured = [
        {
          id: 1,
          brand: 'Debi',
          name: 'Debi Velvet Lip Cloud',
          price: 24.9,
          gradientFrom: '#E4C6BD',
          gradientTo: '#A85D5A',
          badge: 'Novo',
          badgeDaterk: true,
          image: 'assets/produtos/debi-101.jpg',
          rating: 5,
          reviewCount: 12,
          category: 'Labios'
        } as Product
      ];
    }
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) (entry.target as Element).classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  addToCart(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();
    this.cartSvc.add(product);
  }

  toggleWishlist(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();
    void this.wishlist.toggle(product.id).catch(err => {
      window.alert(err?.message || 'Não foi possível guardar na wishlist.');
    });
  }

  subscribe(): void {
    if (this.email && this.email.trim().length) {
      this.subscribed = true;
      this.email = '';
    }
  }
}

