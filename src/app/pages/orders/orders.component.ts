import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models/models';
import { ProductService } from '../../core/services/product.service';
import { WishlistService } from '../../core/services/wishlist.service';

type AccountSection = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'settings';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private productSvc = inject(ProductService);
  wishlist = inject(WishlistService);

  session = this.auth.session;
  activeSection: AccountSection = 'overview';
  profileName = '';
  profileEmail = '';
  profilePhone = '';
  addressName = '';
  addressLine = '';
  addressPostcode = '';
  addressCity = '';
  addressCountry = 'Portugal';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingProfile = false;
  savingAddress = false;
  savingPassword = false;
  profileMessage = '';
  profileError = '';
  addressMessage = '';
  addressError = '';
  passwordMessage = '';
  passwordError = '';
  addressLoaded = false;
  allProducts: Product[] = this.productSvc.getAll();
  wishlistLoading = false;
  wishlistError = '';

  get initials(): string {
    const name = this.session()?.name || 'Cliente';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }

  setSection(section: AccountSection): void {
    this.activeSection = section;
    const account = this.session();
    if (section === 'settings' && account) {
      this.profileName = account.name;
      this.profileEmail = account.email;
      void this.loadProfilePhone();
    }
    if (section === 'addresses') {
      void this.loadAddress();
    }
    if (section === 'wishlist') {
      void this.loadWishlist();
    }
  }

  isActive(section: AccountSection): boolean {
    return this.activeSection === section;
  }

  saveProfile(): void {
    this.profileMessage = '';
    this.profileError = '';

    if (!this.profileName.trim() || !this.profileEmail.trim()) {
      this.profileError = 'Preencha o nome e email.';
      return;
    }

    this.savingProfile = true;
    this.auth.updateAccount(this.profileName, this.profileEmail).then(() => {
      const account = this.session();
      if (!account) return;
      return this.auth.saveCheckoutProfile({
        name: this.profileName,
        email: this.profileEmail,
        phone: this.profilePhone,
        address: this.addressLine,
        postcode: this.addressPostcode,
        city: this.addressCity,
        country: this.addressCountry || 'Portugal'
      });
    }).then(() => {
      this.savingProfile = false;
      this.profileMessage = 'Dados guardados. Se mudou o email, confirme a mensagem enviada pela Supabase.';
    }).catch(err => {
      this.savingProfile = false;
      this.profileError = err?.message || 'Nao foi possivel guardar os dados.';
    });
  }

  get hasSavedAddress(): boolean {
    return !!(this.addressLine || this.addressPostcode || this.addressCity);
  }

  loadProfilePhone(): Promise<void> {
    return this.auth.getCheckoutProfile().then(profile => {
      this.profilePhone = profile?.phone || '';
    }).catch(() => {
      this.profilePhone = '';
    });
  }

  loadAddress(): Promise<void> {
    if (this.addressLoaded) return Promise.resolve();
    return this.auth.getCheckoutProfile().then(profile => {
      const account = this.session();
      this.addressName = profile?.name || account?.name || '';
      this.addressLine = profile?.address || '';
      this.addressPostcode = profile?.postcode || '';
      this.addressCity = profile?.city || '';
      this.addressCountry = profile?.country || 'Portugal';
      this.addressLoaded = true;
    }).catch(err => {
      this.addressError = err?.message || 'Nao foi possivel carregar o endereco.';
    });
  }

  saveAddress(): void {
    this.addressMessage = '';
    this.addressError = '';

    const account = this.session();
    if (!account) {
      this.addressError = 'Sessao expirada. Entre novamente.';
      return;
    }

    if (!this.addressLine.trim() || !this.addressPostcode.trim() || !this.addressCity.trim()) {
      this.addressError = 'Preencha morada, codigo postal e cidade.';
      return;
    }

    this.savingAddress = true;
    this.auth.saveCheckoutProfile({
      name: this.addressName || account.name,
      email: account.email,
      phone: this.profilePhone,
      address: this.addressLine,
      postcode: this.addressPostcode,
      city: this.addressCity,
      country: this.addressCountry || 'Portugal'
    }).then(() => {
      this.savingAddress = false;
      this.addressLoaded = true;
      this.addressMessage = 'Endereco guardado com sucesso.';
    }).catch(err => {
      this.savingAddress = false;
      this.addressError = err?.message || 'Nao foi possivel guardar o endereco.';
    });
  }

  savePassword(): void {
    this.passwordMessage = '';
    this.passwordError = '';

    if (this.newPassword.length < 8) {
      this.passwordError = 'A nova password deve ter pelo menos 8 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'As passwords nao coincidem.';
      return;
    }

    this.savingPassword = true;
    this.auth.updatePassword(this.newPassword).then(() => {
      this.savingPassword = false;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.passwordMessage = 'Password atualizada com sucesso.';
    }).catch(err => {
      this.savingPassword = false;
      this.passwordError = err?.message || 'Nao foi possivel atualizar a password.';
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  get wishlistProducts(): Product[] {
    const ids = this.wishlist.ids();
    return ids
      .map(id => this.allProducts.find(product => product.id === id))
      .filter((product): product is Product => !!product);
  }

  loadWishlist(): Promise<void> {
    this.wishlistLoading = true;
    this.wishlistError = '';

    return new Promise(resolve => {
      this.productSvc.loadAll().subscribe({
        next: products => {
          this.allProducts = products;
          this.wishlist.load().then(() => {
            this.wishlistLoading = false;
            resolve();
          }).catch(err => {
            this.wishlistLoading = false;
            this.wishlistError = err?.message || 'Nao foi possivel carregar a wishlist.';
            resolve();
          });
        },
        error: () => {
          this.wishlistLoading = false;
          this.wishlistError = 'Nao foi possivel carregar os produtos.';
          resolve();
        }
      });
    });
  }

  removeWishlist(productId: number): void {
    void this.wishlist.remove(productId).catch(err => {
      this.wishlistError = err?.message || 'Nao foi possivel remover o produto.';
    });
  }
}
