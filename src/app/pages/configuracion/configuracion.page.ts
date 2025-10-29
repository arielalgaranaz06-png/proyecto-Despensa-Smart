import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton,
  IonList, IonItem, IonLabel, IonToggle, IonToast,
  IonAccordion, IonAccordionGroup, IonIcon,
  IonAlert
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { NotificationsService } from '../../services/notifications.service';
import { AuthRestService } from '../../services/auth-rest.service';
import { ProfileService, UserProfile } from '../../services/profile.service';
import { addIcons } from 'ionicons';
import { 
  personCircleOutline, notificationsOutline, shieldCheckmarkOutline,
  pencilOutline, mailOutline, cameraOutline, informationCircleOutline,
  keyOutline, logOutOutline, powerOutline, chevronForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton,
    IonList, IonItem, IonLabel, IonToggle, IonToast,
    IonAccordion, IonAccordionGroup, IonIcon,
    IonAlert, CommonModule, FormsModule
  ]
})
export class ConfiguracionPage implements OnInit {
  // Notificaciones
  notificationsEnabled: boolean = false;
  lowStockAlerts: boolean = true;
  expiryAlerts: boolean = true;
  recipeSuggestions: boolean = true;
  
  // Perfil
  userProfile: UserProfile | null = null;
  
  // Alertas
  showToast: boolean = false;
  toastMessage: string = '';
  showPasswordAlert: boolean = false;
  showEmailAlert: boolean = false;
  showNameAlert: boolean = false;
  showReauthAlert: boolean = false;
  
  // Formularios
  newPassword: string = '';
  confirmPassword: string = '';
  newEmail: string = '';
  newName: string = '';
  reauthPassword: string = '';
  currentOperation: 'password' | 'email' = 'password';

  // Botones de alertas
  alertButtonsName = [
    { text: 'Cancelar', role: 'cancel' },
    { text: 'Guardar', role: 'confirm' }
  ];

  alertButtonsEmail = [
    { text: 'Cancelar', role: 'cancel' },
    { text: 'Guardar', role: 'confirm' }
  ];

  alertButtonsPassword = [
    { text: 'Cancelar', role: 'cancel' },
    { text: 'Cambiar', role: 'confirm' }
  ];

  alertButtonsReauth = [
    { text: 'Cancelar', role: 'cancel' },
    { text: 'Continuar', role: 'confirm' }
  ];

  constructor(
    private router: Router,
    private notificationsService: NotificationsService,
    private authService: AuthRestService,
    private profileService: ProfileService
  ) { 
addIcons({
  personCircleOutline,
  pencilOutline,
  chevronForwardOutline,
  mailOutline,
  cameraOutline,
  informationCircleOutline,
  notificationsOutline,
  shieldCheckmarkOutline,
  keyOutline,
  logOutOutline,
  powerOutline
});
}
  async ngOnInit() {
    await this.loadSettings();
    this.loadUserProfile();
  }
  gotoMenuPrincipal() {
    this.router.navigate(['/menu-principal']); 
  }
  async loadSettings() {
    const settings = localStorage.getItem('notificationSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.notificationsEnabled = parsed.notificationsEnabled ?? false;
      this.lowStockAlerts = parsed.lowStockAlerts ?? true;
      this.expiryAlerts = parsed.expiryAlerts ?? true;
      this.recipeSuggestions = parsed.recipeSuggestions ?? true;
    }

    if (this.notificationsEnabled) {
      const hasPermission = await this.notificationsService.checkPermissions();
      if (!hasPermission) {
        this.notificationsEnabled = false;
        this.saveNotificationSettings();
      }
    }
  }

  loadUserProfile() {
    this.userProfile = this.profileService.getUserProfile();
    if (!this.userProfile) {
      const user = this.authService.getCurrentUser();
      if (user && user.email) {
        this.profileService.initializeProfile(user.email, user.displayName || '');
        this.userProfile = this.profileService.getUserProfile();
      }
    }
  }

  // NOTIFICACIONES
  async toggleNotifications() {
    if (this.notificationsEnabled) {
      const granted = await this.notificationsService.requestPermissions();
      if (!granted) {
        this.notificationsEnabled = false;
        this.showMessage('Permisos de notificación denegados');
        return;
      }
      this.notificationsService.setNotificationsEnabled(true);
      this.showMessage('Notificaciones activadas');
    } else {
      this.notificationsService.setNotificationsEnabled(false);
      this.showMessage('Notificaciones desactivadas');
    }
    this.saveNotificationSettings();
  }

  saveNotificationSettings() {
    const settings = {
      notificationsEnabled: this.notificationsEnabled,
      lowStockAlerts: this.lowStockAlerts,
      expiryAlerts: this.expiryAlerts,
      recipeSuggestions: this.recipeSuggestions
    };
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }

  async testNotifications() {
    if (!this.notificationsEnabled) return;

    try {
      await this.notificationsService.scheduleLowStockNotification(3);
      
      setTimeout(async () => {
        await this.notificationsService.scheduleExpiryNotification(2);
      }, 2000);

      this.showMessage('Notificaciones de prueba enviadas');
    } catch (error) {
      console.error('Error testing notifications:', error);
      this.showMessage('Error al enviar notificaciones de prueba');
    }
  }

  // PERFIL - EDITAR NOMBRE
  openEditName() {
    this.newName = this.userProfile?.displayName || '';
    this.showNameAlert = true;
  }

  onNameAlertDismiss(event: any) {
    this.showNameAlert = false;
    if (event.detail.role === 'confirm' && event.detail.data) {
      this.newName = event.detail.data.values.name;
      this.updateDisplayName();
    }
  }

  async updateDisplayName() {
    if (!this.newName.trim()) {
      this.showMessage('El nombre no puede estar vacío');
      return;
    }

    try {
      this.profileService.updateDisplayName(this.newName);
      this.loadUserProfile();
      this.showMessage('Nombre actualizado correctamente');
    } catch (error) {
      this.showMessage('Error al actualizar el nombre');
    }
  }

  // PERFIL - EDITAR EMAIL
  openEditEmail() {
    this.currentOperation = 'email';
    this.showReauthAlert = true;
  }

  onReauthAlertDismiss(event: any) {
    this.showReauthAlert = false;
    if (event.detail.role === 'confirm' && event.detail.data) {
      this.reauthPassword = event.detail.data.values.password;
      this.handleReauthentication();
    }
  }

  async handleReauthentication() {
    try {
      const success = await this.reauthenticateUser();
      if (success) {
        if (this.currentOperation === 'email') {
          this.newEmail = this.userProfile?.email || '';
          this.showEmailAlert = true;
        } else if (this.currentOperation === 'password') {
          this.newPassword = '';
          this.confirmPassword = '';
          this.showPasswordAlert = true;
        }
      }
    } catch (error) {
      this.showMessage('Error en la autenticación');
    }
  }

  onEmailAlertDismiss(event: any) {
    this.showEmailAlert = false;
    if (event.detail.role === 'confirm' && event.detail.data) {
      this.newEmail = event.detail.data.values.email;
      this.updateEmail();
    }
  }

  async updateEmail() {
    if (!this.newEmail.trim() || !this.validateEmail(this.newEmail)) {
      this.showMessage('Ingresa un email válido');
      return;
    }

    try {
      await this.authService.updateUserEmail(this.newEmail);
      this.profileService.initializeProfile(this.newEmail, this.userProfile?.displayName || '');
      this.loadUserProfile();
      this.showMessage('Email actualizado correctamente');
    } catch (error: any) {
      this.showMessage('Error al actualizar email: ' + error.message);
    }
  }

  // PERFIL - FOTO DE PERFIL (simulada)
  updateProfilePhoto() {
    const fakePhotoURL = 'https://via.placeholder.com/150/27AE60/FFFFFF?text=Usuario';
    this.profileService.updatePhotoURL(fakePhotoURL);
    this.loadUserProfile();
    this.showMessage('Foto de perfil actualizada');
  }

  // PERFIL - INFORMACIÓN DE CUENTA
  showAccountInfo() {
    const user = this.authService.getCurrentUser();
    const info = `
Email: ${this.userProfile?.email}
Nombre: ${this.userProfile?.displayName}
Cuenta creada: ${this.userProfile?.createdAt ? new Date(this.userProfile.createdAt).toLocaleDateString() : 'N/A'}
Último acceso: ${this.userProfile?.lastLogin ? new Date(this.userProfile.lastLogin).toLocaleDateString() : 'N/A'}
    `;
    this.showMessage(info);
  }

  // SEGURIDAD - CAMBIAR CONTRASEÑA
  openChangePassword() {
    this.currentOperation = 'password';
    this.showReauthAlert = true;
  }

  onPasswordAlertDismiss(event: any) {
    this.showPasswordAlert = false;
    if (event.detail.role === 'confirm' && event.detail.data) {
      this.newPassword = event.detail.data.values.password;
      this.confirmPassword = event.detail.data.values.confirmPassword;
      this.changePassword();
    }
  }

  async changePassword() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.showMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showMessage('Las contraseñas no coinciden');
      return;
    }

    try {
      await this.authService.updateUserPassword(this.newPassword);
      this.showMessage('Contraseña actualizada correctamente');
    } catch (error: any) {
      this.showMessage('Error al cambiar contraseña: ' + error.message);
    }
  }

  // REAUTENTICACIÓN
  async reauthenticateUser(): Promise<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user || !user.email) {
      this.showMessage('No hay usuario autenticado');
      return false;
    }

    try {
      await this.authService.reauthenticateUser(user.email, this.reauthPassword);
      this.reauthPassword = '';
      return true;
    } catch (error: any) {
      this.showMessage('Contraseña incorrecta');
      return false;
    }
  }

  // SEGURIDAD - CERRAR SESIÓN EN TODOS LOS DISPOSITIVOS (simulado)
  logoutAllDevices() {
    this.showMessage('Se ha cerrado sesión en todos los dispositivos');
  }

  // SEGURIDAD - CERRAR SESIÓN
  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
      this.showMessage('Sesión cerrada correctamente');
    } catch (error) {
      this.showMessage('Error al cerrar sesión');
    }
  }

  // VALIDACIÓN DE EMAIL
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
  }
}