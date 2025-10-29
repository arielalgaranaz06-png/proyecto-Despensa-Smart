import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButton, IonItem, IonLabel, IonInput, IonSelect, 
  IonSelectOption, IonDatetime, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonBackButton,
  IonButtons, IonToast, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ProductosService } from '../../../services/productos.service';
import { CategoriasService } from '../../../services/categorias.service';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButton, IonItem, IonLabel, IonInput, IonSelect, 
    IonSelectOption, IonDatetime, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonBackButton,
    IonButtons, IonToast, IonSpinner,
    CommonModule, FormsModule, IonIcon
  ]
})
export class RegistroPage implements OnInit {
  producto = {
    nombre: '',
    cantidad: '',
    categoriaId: '', // Este debe ser el ID de la categoría, no el nombre
    fechaVencimiento: '',
    minimoStock: '2',
    activo: true
  };

  // Cambiar a array de objetos con id y nombre
  categorias: any[] = [];
  isLoadingCategorias: boolean = true;

  isSubmitting: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';

  constructor(
    private router: Router,
    private productosService: ProductosService,
    private categoriasService: CategoriasService // INYECTAR SERVICIO
  ) { }

  ngOnInit() {
    this.loadCategorias();
  }
gotoMenuPrincipal() {
  this.router.navigate(['/menu-principal']);
}
  // NUEVO MÉTODO PARA CARGAR CATEGORÍAS REALES
  async  loadCategorias() {
  this.isLoadingCategorias = true;
  this.categoriasService.getAll().subscribe({
    next: (categorias) => {
      this.categorias = categorias;
      this.isLoadingCategorias = false;
    },
    error: (error) => {
      console.error('Error loading categories:', error);
      this.isLoadingCategorias = false;
    }
  });
}

  onSubmit() {
    if (!this.producto.nombre.trim()) {
      this.showToastMessage('El nombre del producto es requerido');
      return;
    }

    if (!this.producto.cantidad || parseInt(this.producto.cantidad) <= 0) {
      this.showToastMessage('La cantidad debe ser mayor a 0');
      return;
    }

    // Validar que se seleccionó una categoría válida
    if (!this.producto.categoriaId) {
      this.showToastMessage('Debes seleccionar una categoría');
      return;
    }

    this.isSubmitting = true;

    const productoData = {
  nombre: this.producto.nombre.trim(),
  cantidad: parseInt(this.producto.cantidad),
  categoriaId: this.producto.categoriaId, // ✅ CORRECTO: categoriaId
  fechaVencimiento: this.producto.fechaVencimiento || '',
  minimoStock: Number(this.producto.minimoStock) || 2,
  activo: true,
  fechaRegistro: new Date().toISOString(),
  fechaModificacion: new Date().toISOString()
};

    this.productosService.create(productoData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.showToastMessage('Producto agregado correctamente');
        this.resetForm();
        
        setTimeout(() => {
          this.router.navigate(['/lista']);
        }, 2000);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        console.error('Error al agregar producto:', error);
        this.showToastMessage('Error al agregar el producto. Verifica la conexión.');
      }
    });
  }

  resetForm() {
    this.producto = {
      nombre: '',
      cantidad: '',
      categoriaId: '',
      fechaVencimiento: '',
      minimoStock: '2',
      activo: true
    };
  }

  showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastDismiss() {
    this.showToast = false;
  }

  goBack() {
    this.router.navigate(['/menu-principal']);
  }
}