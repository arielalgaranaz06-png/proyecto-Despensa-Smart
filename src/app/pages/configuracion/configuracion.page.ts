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
  pencilOutline, mailOutline, keyOutline, powerOutline, chevronForwardOutline
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
  // Variables para configuración de notificaciones
  notificationsEnabled: boolean = false;
  lowStockAlerts: boolean = true;
  expiryAlerts: boolean = true;
  recipeSuggestions: boolean = true;
  
  // Variables para perfil de usuario
  userProfile: UserProfile | null = null;
  
  // Variables para control de alertas
  showToast: boolean = false;
  toastMessage: string = '';
  showPasswordAlert: boolean = false;
  showEmailAlert: boolean = false;
  showNameAlert: boolean = false;
  showReauthAlert: boolean = false;
  
  // Variables para formularios
  newPassword: string = '';
  confirmPassword: string = '';
  newEmail: string = '';
  newName: string = '';
  reauthPassword: string = '';
  currentOperation: 'password' | 'email' = 'password';

  // Configuración de botones para alertas
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
    // Registrar iconos utilizados en la interfaz
    addIcons({
      personCircleOutline,
      pencilOutline,
      chevronForwardOutline,
      mailOutline,
      notificationsOutline,
      shieldCheckmarkOutline,
      keyOutline,
      powerOutline
    });
  }

  // Inicialización del componente
  async ngOnInit() {
    await this.loadSettings();
    this.loadUserProfile();
  }

  // Navegación al menú principal
  gotoMenuPrincipal() {
    this.router.navigate(['/menu-principal']); 
  }

  // Cargar configuración de notificaciones desde localStorage
  async loadSettings() {
    const settings = localStorage.getItem('notificationSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.notificationsEnabled = parsed.notificationsEnabled ?? false;
      this.lowStockAlerts = parsed.lowStockAlerts ?? true;
      this.expiryAlerts = parsed.expiryAlerts ?? true;
      this.recipeSuggestions = parsed.recipeSuggestions ?? true;
    }

    // Verificar permisos de notificaciones si están habilitadas
    if (this.notificationsEnabled) {
      const hasPermission = await this.notificationsService.checkPermissions();
      if (!hasPermission) {
        this.notificationsEnabled = false;
        this.saveNotificationSettings();
      }
    }
  }

  // Cargar perfil de usuario
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

  // MÉTODOS DE NOTIFICACIONES

  // Activar/desactivar notificaciones
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

  // Guardar configuración de notificaciones
  saveNotificationSettings() {
    const settings = {
      notificationsEnabled: this.notificationsEnabled,
      lowStockAlerts: this.lowStockAlerts,
      expiryAlerts: this.expiryAlerts,
      recipeSuggestions: this.recipeSuggestions
    };
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }

  // Probar notificaciones
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

  // MÉTODOS DE PERFIL - EDITAR NOMBRE

  // Abrir alerta para editar nombre
  openEditName() {
    this.newName = this.userProfile?.displayName || '';
    this.showNameAlert = true;
  }

  // Manejar cierre de alerta de nombre
  onNameAlertDismiss(event: any) {
    this.showNameAlert = false;
    if (event.detail.role === 'confirm' && event.detail.data) {
      this.newName = event.detail.data.values.name;
      this.updateDisplayName();
    }
  }

  // Actualizar nombre de usuario
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

  // MÉTODOS DE PERFIL - EDITAR EMAIL

  // Abrir flujo para editar email (comienza con reautenticación)
  openEditEmail() {
    this.currentOperation = 'email';
    this.showReauthAlert = true;
  }

  // Manejar cierre de alerta de reautenticación
  onReauthAlertDismiss(event: any) {
    this.showReauthAlert = false;
    if (event.detail.role === 'confirm' && event.detail.data) {
      this.reauthPassword = event.detail.data.values.password;
      this.handleReauthentication();
    }
  }

  // Procesar reautenticación
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

  // Manejar cierre de alerta de email
  onEmailAlertDismiss(event: any) {
    this.showEmailAlert = false;
    if (event.detail.role === 'confirm' && event.detail.data) {
      this.newEmail = event.detail.data.values.email;
      this.updateEmail();
    }
  }

  // Actualizar email del usuario
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

  // MÉTODOS DE SEGURIDAD - CAMBIAR CONTRASEÑA

  // Abrir flujo para cambiar contraseña (comienza con reautenticación)
  openChangePassword() {
    this.currentOperation = 'password';
    this.showReauthAlert = true;
  }

  // Manejar cierre de alerta de contraseña
  onPasswordAlertDismiss(event: any) {
    this.showPasswordAlert = false;
    if (event.detail.role === 'confirm' && event.detail.data) {
      this.newPassword = event.detail.data.values.password;
      this.confirmPassword = event.detail.data.values.confirmPassword;
      this.changePassword();
    }
  }

  // Cambiar contraseña del usuario
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

  // MÉTODOS DE REAUTENTICACIÓN

  // Reautenticar usuario para operaciones sensibles
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

  // MÉTODOS DE SEGURIDAD - CERRAR SESIÓN

  // Cerrar sesión del usuario
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

  // Validar formato de email
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // MOSTRAR MENSAJES

  // Mostrar mensaje toast
  showMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
  }
}