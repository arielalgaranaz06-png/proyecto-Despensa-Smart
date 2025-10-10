import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Firebase } from '../services/firebase';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const fb = inject(Firebase);

  return new Promise<boolean>((resolve) => {
    const unsub = fb.onAuthState((user) => {
      unsub();
      if (user) {
        resolve(true);
      } else {
        router.navigate(['/home']);
        resolve(false);
      }
    });
  });
};
