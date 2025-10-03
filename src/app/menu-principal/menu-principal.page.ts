import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu-principal',
  templateUrl: './menu-principal.page.html',
  styleUrls: ['./menu-principal.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon
  ]
})
export class MenuPrincipalPage {

  constructor(private router: Router) {}

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToDespensa() {
    console.log('Navegando a Despensa');
  }

  goToRecetas() {
    console.log('Navegando a Recetas');
  }

  goToConfiguracion() {
    console.log('Navegando a Configuración');
  }
}