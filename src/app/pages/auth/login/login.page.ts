import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent, IonItem, IonLabel, IonInput, IonButton, 
  IonSpinner, IonToast
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthRestService } from '../../../services/auth-rest.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonItem, IonLabel, IonInput, IonButton, 
    IonSpinner, IonToast, FormsModule, CommonModule
  ]
})
export class LoginPage {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  showToast: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthRestService
  ) {}

  async login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.showError('Usuario y contraseña son obligatorios');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('Intentando login con:', this.username);
      const userCredential = await this.authService.loginWithEmail(this.username, this.password);
      console.log('Login exitoso:', userCredential.user.email);
      
      this.showSuccess('¡Bienvenido!');
      
      setTimeout(() => {
        this.router.navigate(['/menu-principal']);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error completo en login:', error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          this.showError('El formato del email es inválido');
          break;
        case 'auth/user-not-found':
          this.showError('No existe una cuenta con este email');
          break;
        case 'auth/wrong-password':
          this.showError('Contraseña incorrecta');
          break;
        case 'auth/invalid-credential':
          this.showError('Email o contraseña incorrectos');
          break;
        case 'auth/too-many-requests':
          this.showError('Demasiados intentos fallidos. Intenta más tarde');
          break;
        default:
          this.showError('Error al iniciar sesión: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      this.isLoading = false;
    }
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.showToast = true;
  }

  private showSuccess(message: string) {
    this.errorMessage = message;
    this.showToast = true;
  }

  onToastDismiss() {
    this.showToast = false;
    this.errorMessage = '';
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}