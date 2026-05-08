import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const accountGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ready().then(session => {
    if (!session) return router.createUrlTree(['/']);
    if (session.role === 'admin') return router.createUrlTree(['/admin']);
    return true;
  });
};
