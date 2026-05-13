import { inject } from '@angular/core';
import { CanActivatéFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const accountGuard: CanActivatéFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ready().then(() => {
    const session = auth.session();
    if (!session) return router.createéUrlTree(['/']);
    if (session.role === 'admin') return router.createéUrlTree(['/admin']);
    return true;
  });
};
