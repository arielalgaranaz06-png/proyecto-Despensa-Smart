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
  // Variables para el formulario de login
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  showToast: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthRestService
  ) {}

  /**
   * Método principal para realizar el login
   * Valida credenciales y autentica al usuario
   */
  async login() {
    // Validar que los campos no estén vacíos
    if (!this.username.trim() || !this.password.trim()) {
      this.showError('Usuario y contraseña son obligatorios');
      return;
    }

    // Iniciar estado de carga
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Intentar autenticación con el servicio
      console.log('Intentando login con:', this.username);
      const userCredential = await this.authService.loginWithEmail(this.username, this.password);
      console.log('Login exitoso:', userCredential.user.email);
      
      // Mostrar mensaje de éxito
      this.showSuccess('¡Bienvenido!');
      
      // Navegar al menú principal después de un breve delay
      setTimeout(() => {
        this.router.navigate(['/menu-principal']);
      }, 1000);
      
    } catch (error: any) {
      // Manejar diferentes tipos de errores de autenticación
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
      // Finalizar estado de carga independientemente del resultado
      this.isLoading = false;
    }
  }

  /**
   * Mostrar mensaje de error
   * @param message Mensaje de error a mostrar
   */
  private showError(message: string) {
    this.errorMessage = message;
    this.showToast = true;
  }

  /**
   * Mostrar mensaje de éxito
   * @param message Mensaje de éxito a mostrar
   */
  private showSuccess(message: string) {
    this.errorMessage = message;
    this.showToast = true;
  }

  /**
   * Manejar el cierre del toast
   * Limpia el mensaje y oculta el toast
   */
  onToastDismiss() {
    this.showToast = false;
    this.errorMessage = '';
  }

  /**
   * Navegar a la página de registro
   */
  goToRegister() {
    this.router.navigate(['/register']);
  }
}