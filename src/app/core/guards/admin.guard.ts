import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ready().then(() => {
    const session = auth.session();
    if (session?.role === 'admin') return true;
    return router.createUrlTree(['/']);
  });
};

