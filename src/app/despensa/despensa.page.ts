import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar ,IonButton, IonItem,IonList, IonLabel, IonInput} from '@ionic/angular/standalone';
import { Firebase } from '../services/firebase';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-despensa',
  templateUrl: './despensa.page.html',
  styleUrls: ['./despensa.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonButton,IonItem,IonList,IonLabel,IonInput] //agregados button e item
})
export class DespensaPage implements OnInit {
  items: Array<{ name: string; qty: number; note?: string }> = [];
  editing = false;
  editIndex = -1;
  editModel: { name: string; qty: number; note?: string } = { name: '', qty: 1, note: '' };
  storageKey = 'despensa_items';

  constructor(private fb: Firebase) { }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.items = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('No se pudo leer localStorage', e);
      this.items = [];
    }
  }

  saveItems() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  startAdd() {
    this.editIndex = -1;
    this.editModel = { name: '', qty: 1, note: '' };
    this.editing = true;
  }

  startEdit(index: number) {
    const it = this.items[index];
    this.editIndex = index;
    this.editModel = { name: it.name, qty: it.qty, note: it.note };
    this.editing = true;
  }

  cancelEdit() {
    this.editing = false;
  }

  saveEdit() {
    const model = { ...this.editModel };
    if (!model.name || model.name.trim() === '') return;
    model.qty = Number(model.qty) || 1;
    if (this.editIndex === -1) {
      this.items.unshift(model);
    } else {
      this.items[this.editIndex] = model;
    }
    this.saveItems();
    this.editing = false;
  }

  deleteItem(index: number) {
    if (!confirm('¿Eliminar este elemento?')) return;
    this.items.splice(index, 1);
    this.saveItems();
  }

  async uploadAll() {
    if (!this.items || this.items.length === 0) {
      alert('No hay elementos para subir');
      return;
    }

    try {
      const auth = getAuth();
      const uid = auth.currentUser ? auth.currentUser.uid : null;
      const pathBase = uid ? `users/${uid}/despensa` : 'despensa';

      // subir cada elemento
      for (const it of this.items) {
        await this.fb.addDocument(pathBase, { ...it, createdAt: new Date().toISOString() });
      }

      alert('Todos los elementos se subieron correctamente.');
    } catch (e) {
      console.error('Error subiendo elementos', e);
      alert('Error subiendo elementos: ' + String(e));
    }
  }

}
