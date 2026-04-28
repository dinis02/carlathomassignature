import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  template: `
    <div style="padding: 40px; text-align: center;">
      <h1>Bem-vindo, Admin!</h1>
      <p>Esta é a área administrativa do site.</p>
    </div>
  `,
  styles: []
})
export class AdminDashboardComponent {}
