import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private isAdminLoggedIn = false;

  loginAsAdmin() {
    this.isAdminLoggedIn = true;
  }

  logoutAdmin() {
    this.isAdminLoggedIn = false;
  }

  isAdmin() {
    return this.isAdminLoggedIn;
  }
}
