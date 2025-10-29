import { Injectable } from '@angular/core';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  lastLogin: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor() { }

  // OBTENER PERFIL DEL USUARIO
  getUserProfile(): UserProfile | null {
    const profile = localStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : null;
  }

  // GUARDAR PERFIL DEL USUARIO
  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }

  // ACTUALIZAR NOMBRE DE USUARIO
  updateDisplayName(displayName: string): void {
    const profile = this.getUserProfile();
    if (profile) {
      profile.displayName = displayName;
      this.saveUserProfile(profile);
    }
  }

  // ACTUALIZAR FOTO DE PERFIL
  updatePhotoURL(photoURL: string): void {
    const profile = this.getUserProfile();
    if (profile) {
      profile.photoURL = photoURL;
      this.saveUserProfile(profile);
    }
  }

  // INICIALIZAR PERFIL POR PRIMERA VEZ
  initializeProfile(email: string, displayName: string = ''): void {
    const profile: UserProfile = {
      displayName: displayName || email.split('@')[0],
      email: email,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    this.saveUserProfile(profile);
  }

  // ACTUALIZAR ÚLTIMO LOGIN
  updateLastLogin(): void {
    const profile = this.getUserProfile();
    if (profile) {
      profile.lastLogin = new Date().toISOString();
      this.saveUserProfile(profile);
    }
  }
}