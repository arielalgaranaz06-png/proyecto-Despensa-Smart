import { Injectable } from '@angular/core';
import { 
  initializeApp, 
  getApps
} from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  updateEmail,
  sendPasswordResetEmail,
  signOut,
  User,
  UserCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged
} from 'firebase/auth';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthRestService {
  private token: string | null = null;
  private auth: any;

  constructor() {
    // ✅ ELIMINADO: signInAnonymously - esto causaba conflictos
    if (!getApps().length) initializeApp(environment.firebase as any);
    this.auth = getAuth();
    
    // ✅ Escuchar cambios de autenticación
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.updateToken(user);
      } else {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
      }
    });
  }

  // REAUTENTICACIÓN
  async reauthenticateUser(email: string, password: string): Promise<UserCredential> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const credential = EmailAuthProvider.credential(email, password);
    return await reauthenticateWithCredential(user, credential);
  }

  async loginWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.updateToken(userCredential.user);
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async registerWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.updateToken(userCredential.user);
      return userCredential;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async updateUserPassword(newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    
    await updatePassword(user, newPassword);
  }

  async updateUserEmail(newEmail: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    
    await updateEmail(user, newEmail);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  private async updateToken(user: any): Promise<void> {
    this.token = await user.getIdToken();
    localStorage.setItem('token', this.getToken()!);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  async refreshToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    this.token = await user.getIdToken(true);
    localStorage.setItem('token', this.getToken()!);
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}