import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonInput, 
  IonLabel, 
  IonSelect, 
  IonSelectOption, 
  IonButton, 
  IonDatetime, 
  IonDatetimeButton, 
  IonModal,
  IonToggle,
  IonAlert,
  IonBackButton,
  IonButtons,
  IonList,
  IonIcon,
  IonSpinner,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from '../../../services/productos.service';
import { CategoriasService } from '../../../services/categorias.service';
import { Producto } from '../../../models/producto.model';
import { Categoria } from '../../../models/categoria.model';
import { addIcons } from 'ionicons';
import { saveOutline, trashOutline, warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.page.html',
  styleUrls: ['./editar.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonItem, IonInput, IonLabel, IonSelect, IonSelectOption,
    IonButton, IonDatetime, IonDatetimeButton, IonModal,
    IonToggle, IonAlert, IonBackButton, IonButtons,
    IonList, IonIcon, IonSpinner,
    CommonModule, FormsModule
  ]
})
export class EditarPage implements OnInit {
  producto: Producto = {
    id: '', // ✅ Añadido campo id
    nombre: '',
    cantidad: 0,
    categoriaId: '',
    fechaVencimiento: '',
    minimoStock: 2,
    activo: true,
    fechaRegistro: new Date().toISOString(),
    fechaModificacion: new Date().toISOString()
  };

  categorias: Categoria[] = [];
  productoId: string = '';
  isAlertOpen = false;
  alertMessage = '';
  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
    },
    {
      text: 'Confirmar',
      role: 'confirm',
    },
  ];

  fechaVencimientoTemp: string = '';
  isLoading: boolean = true;
  productoEncontrado: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { 
    addIcons({ saveOutline, trashOutline, warningOutline });
  }

  async ngOnInit() {
    console.log('🚀 Inicializando página de edición');
    
    // Obtener el ID de los parámetros de la ruta
    this.productoId = this.route.snapshot.paramMap.get('id') || '';
    console.log('📋 ID del producto desde parámetros:', this.productoId);

    if (!this.productoId) {
      console.error('❌ No se pudo obtener el ID del producto');
      this.isLoading = false;
      this.mostrarToast('Error: No se pudo cargar el producto', 'danger');
      return;
    }

    console.log('✅ ID obtenido correctamente:', this.productoId);
    await this.cargarDatos();
  }

  private async cargarDatos() {
    try {
      // Cargar categorías primero
      await this.cargarCategorias();
      // Luego cargar el producto
      await this.cargarProducto();
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      this.isLoading = false;
    }
  }

  private async cargarProducto() {
    console.log('🔄 Buscando producto con ID:', this.productoId);
    this.isLoading = true;

    const loading = await this.loadingCtrl.create({
      message: 'Cargando producto...'
    });
    await loading.present();

    this.productosService.getAll().subscribe({
      next: (productos) => {
        console.log('📦 Total productos cargados:', productos.length);
        
        if (!productos || productos.length === 0) {
          console.error('❌ No hay productos disponibles');
          this.productoNoEncontrado();
          loading.dismiss();
          return;
        }

        // Debug: mostrar todos los IDs disponibles
        console.log('🔍 IDs disponibles en Firestore:', productos.map(p => p.id));
        
        // Buscar el producto por ID
        const productoEncontrado = productos.find(p => p.id === this.productoId);
        
        if (productoEncontrado) {
          console.log('✅ PRODUCTO ENCONTRADO:', productoEncontrado.nombre);
          this.producto = { ...productoEncontrado };
          this.productoEncontrado = true;
          
          // Formatear fecha para el datetime
          if (this.producto.fechaVencimiento) {
            this.fechaVencimientoTemp = this.formatDateForDatetime(this.producto.fechaVencimiento);
          }
          
          console.log('📝 Datos cargados:', {
            nombre: this.producto.nombre,
            cantidad: this.producto.cantidad,
            categoriaId: this.producto.categoriaId,
            fechaVencimiento: this.producto.fechaVencimiento
          });
        } else {
          console.error('❌ Producto no encontrado en la lista');
          console.log('   ID buscado:', this.productoId);
          console.log('   IDs disponibles:', productos.map(p => p.id));
          this.productoNoEncontrado();
        }
        
        this.isLoading = false;
        loading.dismiss();
      },
      error: (error) => {
        console.error('❌ Error cargando producto:', error);
        this.isLoading = false;
        loading.dismiss();
        this.mostrarToast('Error cargando producto', 'danger');
      }
    });
  }

  private async cargarCategorias() {
    console.log('📂 Cargando categorías...');
    return new Promise<void>((resolve) => {
      this.categoriasService.getAll().subscribe({
        next: (categorias) => {
          this.categorias = categorias;
          console.log('✅ Categorías cargadas:', this.categorias.length);
          console.log('📋 Lista de categorías:', this.categorias.map(c => ({id: c.id, nombre: c.nombre})));
          resolve();
        },
        error: (error) => {
          console.error('❌ Error cargando categorías:', error);
          this.categorias = [];
          resolve();
        }
      });
    });
  }

  private productoNoEncontrado() {
    this.productoEncontrado = false;
    this.isLoading = false;
    this.mostrarToast('Producto no encontrado', 'danger');
  }

  private formatDateForDatetime(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  volverAlInicio() {
    this.router.navigate(['/lista']);
  }

  onFechaVencimientoChange(event: any) {
    const fecha = event.detail.value;
    if (fecha) {
      this.producto.fechaVencimiento = new Date(fecha).toISOString();
      console.log('📅 Fecha actualizada:', this.producto.fechaVencimiento);
    }
  }

  limpiarFechaVencimiento() {
    this.producto.fechaVencimiento = '';
    this.fechaVencimientoTemp = '';
  }

  async guardarCambios() {
    console.log('💾 Guardando cambios para:', this.producto.nombre);
    
    // Validaciones
    if (!this.producto.nombre.trim()) {
      this.mostrarAlerta('El nombre es requerido');
      return;
    }

    if (this.producto.cantidad < 0) {
      this.mostrarAlerta('La cantidad no puede ser negativa');
      return;
    }

    if (!this.producto.categoriaId) {
      this.mostrarAlerta('Debe seleccionar una categoría');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando cambios...'
    });
    await loading.present();

    // Actualizar fecha de modificación
    this.producto.fechaModificacion = new Date().toISOString();

    console.log('📤 Enviando a Firestore:', this.producto);

    this.productosService.update(this.producto).subscribe({
      next: async () => {
        await loading.dismiss();
        this.mostrarToast('Producto actualizado correctamente', 'success');
        this.router.navigate(['/lista']);
      },
      error: async (error) => {
        console.error('❌ Error actualizando producto:', error);
        await loading.dismiss();
        this.mostrarToast('Error al actualizar producto', 'danger');
      }
    });
  }

  async eliminarProducto() {
    if (!this.productoId) return;

    const loading = await this.loadingCtrl.create({
      message: 'Eliminando producto...'
    });
    await loading.present();

    this.productosService.softDelete(this.productoId).subscribe({
      next: async () => {
        await loading.dismiss();
        this.mostrarToast('Producto eliminado correctamente', 'success');
        this.router.navigate(['/lista']);
      },
      error: async (error) => {
        console.error('❌ Error eliminando producto:', error);
        await loading.dismiss();
        this.mostrarToast('Error al eliminar producto', 'danger');
      }
    });
  }

  confirmarEliminar() {
    this.alertMessage = '¿Estás seguro de que quieres eliminar este producto?';
    this.isAlertOpen = true;
  }

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }

  async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  mostrarAlerta(mensaje: string) {
    this.alertMessage = mensaje;
    this.isAlertOpen = true;
  }

  onAlertConfirm(event: any) {
    if (event.detail.role === 'confirm') {
      this.eliminarProducto();
    }
    this.isAlertOpen = false;
  }
}