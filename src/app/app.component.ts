import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  homeOutline,
  personOutline,
  settingsOutline,
  cartOutline,
  restaurantOutline,
  cubeOutline,
  listOutline,
  warningOutline,
  pricetagOutline,
  calendarOutline,
  cashOutline,
  createOutline,
  trashOutline,
  add
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  constructor() {
    // ✅ Registrar todos los iconos que vas a usar
    addIcons({
      'add-outline': addOutline,
      'home-outline': homeOutline,
      'person-outline': personOutline,
      'settings-outline': settingsOutline,
      'cart-outline': cartOutline,
      'restaurant-outline': restaurantOutline,
      'cube-outline': cubeOutline,
      'list-outline': listOutline,
      'warning-outline': warningOutline,
      'pricetag-outline': pricetagOutline,
      'calendar-outline': calendarOutline,
      'cash-outline': cashOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'add': add
    });
  }
}