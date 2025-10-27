import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthRestService {
  private token: string | null = null;

  constructor() {
    if (!getApps().length) initializeApp(environment.firebase as any);
    const auth = getAuth();
    // Si ya hay usuario, toma token, sino,inicia sesión anónimo y guarda el token
    signInAnonymously(auth).then(u => {
      u.user.getIdToken().then(t => {
        this.token = t;
        localStorage.setItem('token', t); // el servico usa esto 
      });
    }).catch(err => console.error('Auth init error', err));
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  // forzar refesh de nuestro token
  async refreshToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    const t = await user.getIdToken(true);
    this.token = t;
    localStorage.setItem('token', t);
    return t;
  }
}
