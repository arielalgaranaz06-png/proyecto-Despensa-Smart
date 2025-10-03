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
  ]
})
export class HomePage {

  constructor(private router: Router) {}

  goToMainMenu() {

    this.router.navigate(['/menu-principal']);
  }
}