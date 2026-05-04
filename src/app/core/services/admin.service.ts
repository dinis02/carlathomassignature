import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private isAdminLoggedIn = false;

  constructor(private auth: AuthService) {}

  loginAsAdmin() {
    this.isAdminLoggedIn = true;
  }

  logoutAdmin() {
    this.isAdminLoggedIn = false;
    this.auth.logout();
  }

  isAdmin() {
    return this.isAdminLoggedIn || this.auth.isAdmin();
  }
}
