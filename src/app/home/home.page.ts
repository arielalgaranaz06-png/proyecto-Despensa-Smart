import { Component, OnInit } from '@angular/core';
import { Network } from '@capacitor/network';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage implements OnInit {
  

  constructor() {
    
  }

  async ngOnInit() {
    let status = await Network.getStatus();
    console.log('connected:', status.connected, 'type:', status.connectionType);
    alert(JSON.stringify(status));
  }


  /*
  const batteryInfo = await Device.getBatteryInfo();
    const porcentaje = Math.round(batteryInfo.batteryLevel * 100);

    // Mostrar en un toast
    const toast = await this.toastController.create({
      message: `Su batería está al ${porcentaje}%`,
      duration: 3000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
     */


    /*
     const info = await Device.getInfo();
    const ipInfo = await Device.getIpAddress();  // IP local de la red

    const mensaje = `Tipo: ${tipo.toUpperCase()}\n` +
                    `IP: ${ipInfo.ip}\n` +
                    `Modelo: ${info.model}`;

    const toast = await this.toastController.create({
      message: mensaje,
      duration: 4000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();

    //Escuchar cambios de red en tiempo real
    Network.addListener('networkStatusChange', async (status) => {
      const newToast = await this.toastController.create({
        message: `Red cambió a: ${status.connectionType}`,
        duration: 3000,
        position: 'bottom',
        color: 'tertiary'
      });
      await newToast.present();
    }); */
}
