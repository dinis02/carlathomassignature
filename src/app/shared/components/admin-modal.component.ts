import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-modal-backdrop" (click)="close()"></div>
    <div class="admin-modal">
      <!-- Conteúdo do modal de admin pode ser colocado aqui, ou pode ser removido se não for mais necessário. -->
      <p style="padding:2rem;">Redirecionando para o painel admin...</p>
    </div>
  `,
  styles: [`
    .admin-modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.3); z-index: 1001;
    }
    .admin-modal {
      position: fixed; top: 0; right: 0; width: 100vw; max-width: 600px; height: 100vh;
      background: #fff; z-index: 1002; box-shadow: -2px 0 16px rgba(0,0,0,0.12);
      transition: transform 0.3s; display: flex; flex-direction: column;
    }
  `]
})
export class AdminModalComponent {
  adminService = inject(AdminService);

  close() {
    this.adminService.logoutAdmin();
  }
}
