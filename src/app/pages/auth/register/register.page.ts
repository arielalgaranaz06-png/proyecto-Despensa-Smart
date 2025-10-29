import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon  // ✅ IonIcon agregado
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons'; // ✅ Importar addIcons
import { eyeOffOutline, eyeOutline, personCircleOutline } from 'ionicons/icons'; // ✅ Importar iconos específicos
import { AuthRestService } from '../../../services/auth-rest.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, // ✅ IonIcon en imports
    FormsModule, CommonModule
  ]
})
export class RegisterPage {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthRestService
  ) {
    // ✅ Registrar los iconos en el constructor
    addIcons({
      'eye-off-outline': eyeOffOutline,
      'eye-outline': eyeOutline,
      'person-circle-outline': personCircleOutline
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // [Mantener el resto del código igual]
  async register() {
    if (!this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'El formato del email es inválido';
      return;
    }

    try {
      await this.authService.registerWithEmail(this.email, this.password);
      this.router.navigate(['/login']);
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage = 'Este email ya está registrado';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'El formato del email es inválido';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'La contraseña es muy débil';
          break;
        default:
          this.errorMessage = 'Error al crear la cuenta: ' + error.message;
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}