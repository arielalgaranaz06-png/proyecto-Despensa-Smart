import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';
import { ProductosService } from '../services/prodcutos.service';
import { Subscription } from 'rxjs';
import { Producto } from '../models/producto.model';

@Component({
  selector: 'app-despensa',
  templateUrl: './despensa.page.html',
  styleUrls: ['./despensa.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonInput, IonButton]
})
export class DespensaPage implements OnInit, OnDestroy {
  productos: any[] = [];
  newProducto: { nombre: string } = { nombre: '' };
  private sub: Subscription | null = null;

  constructor(private prodService: ProductosService) { }

  ngOnInit() {
    // usar el servicio REST para obtener la lista
    this.sub = this.prodService.getAll().subscribe({
      next: (items: Producto[]) => (this.productos = items),
      error: (err: any) => console.error('Error cargando productos:', err)
    }) as any;
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  agregar() {
    const name = (this.newProducto.nombre || '').trim();
    if (!name) return;
    this.prodService.create({ nombre: name }).subscribe({
      next: (p: Producto) => {
        // recargar la lista
        this.prodService.getAll().subscribe((items: Producto[]) => this.productos = items);
        this.newProducto.nombre = '';
      },
      error: (err: any) => console.error('Error agregando producto:', err)
    });
  }

  eliminar(id: string) {
    this.prodService.delete(id).subscribe({
      next: () => this.prodService.getAll().subscribe((items: Producto[]) => this.productos = items),
      error: (err: any) => console.error('Error eliminando producto:', err)
    });
  }
}
