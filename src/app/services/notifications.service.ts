import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private isEnabled = false;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Escuchar clics en notificaciones
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notification clicked:', notification);
    });
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      this.isEnabled = result.display === 'granted';
      return this.isEnabled;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      this.isEnabled = result.display === 'granted';
      return this.isEnabled;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async scheduleLowStockNotification(productosBajos: number): Promise<void> {
    if (!this.isEnabled) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: '📦 Stock Bajo',
          body: `Tienes ${productosBajos} productos con stock bajo`,
          id: 1,
          schedule: { at: new Date(Date.now() + 5000) },
          extra: { type: 'low_stock' }
        }
      ]
    });
  }

  async scheduleExpiryNotification(productosPorCaducar: number): Promise<void> {
    if (!this.isEnabled) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: '⚠️ Productos por Caducar',
          body: `${productosPorCaducar} productos caducan pronto`,
          id: 2,
          schedule: { at: new Date(Date.now() + 10000) },
          extra: { type: 'expiry' }
        }
      ]
    });
  }

  async scheduleDailySummary(totalProductos: number): Promise<void> {
    if (!this.isEnabled) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [
        {
          title: '📊 Resumen Diario',
          body: `Tienes ${totalProductos} productos en tu despensa`,
          id: 3,
          schedule: { at: tomorrow },
          extra: { type: 'daily_summary' }
        }
      ]
    });
  }

  async cancelAllNotifications(): Promise<void> {
    await LocalNotifications.cancel({
      notifications: []
    });
  }

  getNotificationsEnabled(): boolean {
    return this.isEnabled;
  }

  setNotificationsEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.cancelAllNotifications();
    }
  }
}