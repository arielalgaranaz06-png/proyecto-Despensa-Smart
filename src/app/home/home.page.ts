import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent,
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton,
  IonImg 
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Firebase } from '../services/firebase';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonImg
    ,FormsModule
  ]
})
export class HomePage {
  email = '';
  password = '';

  constructor(private router: Router, private fb: Firebase) {
    // escuchar cambios de auth. si ya está logueado, entra directo
    this.fb.onAuthState(user => {
      if (user) this.router.navigate(['/menu-principal']);
    });
  }

  async goToMainMenu() {
    try {
      const user = await this.fb.signIn(this.email, this.password);
      // guardar usuario en Firestore
      await this.fb.saveUserToFirestore(user);
      this.router.navigate(['/menu-principal']);
    } catch (e) {
      console.error('Error iniciando sesión', e);
      
    }
  }

  // met registro 
  async register() {
    try {
      const user = await this.fb.signUp(this.email, this.password);
      await this.fb.saveUserToFirestore(user);
      this.router.navigate(['/menu-principal']);
    } catch (e) {
      console.error('Error registrando', e);
    }
  }
}