import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonButton, IonFab, IonFabButton, IonFabList,
  IonBadge, IonSpinner, AlertController, ToastController,
  IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ProductosService } from '../../../services/productos.service';
import { CategoriasService } from '../../../services/categorias.service';
import { Categoria } from '../../../models/categoria.model';
import { addIcons } from 'ionicons';
import { add, addCircle, home, grid } from 'ionicons/icons';

@Component({
  selector: 'app-lista',
  templateUrl: './lista.page.html',
  styleUrls: ['./lista.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonButton, IonFab, IonFabButton, IonFabList,
    IonBadge, IonSpinner, IonIcon,
    CommonModule, FormsModule
  ]
})
export class ListaPage implements OnInit {
  productos: any[] = [];
  categorias: Categoria[] = [];
  selectedCategory: Categoria | 'all' | null = null;
  isLoading: boolean = true;

  // Colores para categorías basados en el nombre
  private categoryColors = [
    '#2dd36f'
  ];

  constructor(
    private router: Router,
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { 
    // Registrar los iconos
    addIcons({ add, addCircle, home, grid });
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    console.log('🔄 ListaPage - ionViewWillEnter ejecutado');
    this.refreshData();
  }

  loadData() {
    this.isLoading = true;
    
    console.log('🔄 Iniciando carga inicial de datos...');
    
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.productos = productos;
        console.log('✅ Productos cargados:', this.productos.length);
        
        this.categoriasService.getAll().subscribe({
          next: (categorias) => {
            this.categorias = categorias;
            console.log('✅ Categorías cargadas:', this.categorias.length);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ Error cargando categorías:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Error cargando productos:', error);
        this.isLoading = false;
      }
    });
  }

  refreshData() {
    console.log('🔄 Ejecutando refreshData...');
    this.isLoading = true;
    
    this.productosService.refreshProducts().subscribe({
      next: (productos) => {
        this.productos = productos;
        console.log('✅ Productos actualizados:', this.productos.length);
        
        this.categoriasService.getAll().subscribe({
          next: (categorias) => {
            this.categorias = categorias;
            this.isLoading = false;
            console.log('✅ Refresh completado');
          },
          error: (error) => {
            console.error('❌ Error cargando categorías:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Error refrescando productos:', error);
        this.isLoading = false;
      }
    });
  }

  // 🔄 MÉTODOS PARA LA NAVEGACIÓN ENTRE VISTAS
  selectCategory(categoria: Categoria) {
    this.selectedCategory = categoria;
  }

  showAllProducts() {
    this.selectedCategory = 'all';
  }

  goBackToCategories() {
    this.selectedCategory = null;
  }

  // 🔄 MÉTODOS PARA OBTENER DATOS
  getCategoriesWithProducts(): Categoria[] {
    return this.categorias.filter(categoria => 
      this.getProductsByCategory(categoria.id).length > 0
    );
  }

  getProductsByCategory(categoriaId: string): any[] {
    if (!categoriaId) return [];
    return this.productos.filter(producto => 
      producto.categoriaId === categoriaId && producto.activo !== false
    );
  }

  getProductsToShow(): any[] {
    if (!this.selectedCategory) return [];
    
    if (this.selectedCategory === 'all') {
      return this.productos.filter(producto => producto.activo !== false);
    } else {
      return this.getProductsByCategory(this.selectedCategory.id);
    }
  }

  getCategoryTitle(): string {
    if (!this.selectedCategory) return '';
    
    if (this.selectedCategory === 'all') {
      return 'Todos los Productos';
    } else {
      return this.selectedCategory.nombre;
    }
  }

  // 🔄 MÉTODOS PARA ESTADÍSTICAS
  getLowStockInCategory(categoriaId: string): number {
    return this.getProductsByCategory(categoriaId).filter(producto => 
      this.isProductLowStock(producto)
    ).length;
  }

  getLowStockInCurrentCategory(): number {
    return this.getProductsToShow().filter(producto => 
      this.isProductLowStock(producto)
    ).length;
  }

  getExpiringInCurrentCategory(): number {
    return this.getProductsToShow().filter(producto => 
      this.isProductExpiring(producto)
    ).length;
  }

  hasProducts(): boolean {
    const productosActivos = this.productos.filter(producto => producto.activo !== false);
    return productosActivos.length > 0;
  }

  // 🔄 MÉTODOS PARA UI - SIN ICONOS
  getCategoryColor(categoriaId: string): string {
    const categoria = this.categorias.find(cat => cat.id === categoriaId);
    const nombre = categoria?.nombre || categoriaId;
    
    const index = nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.categoryColors[index % this.categoryColors.length];
  }

  getCategoryInitial(categoriaNombre: string): string {
    return categoriaNombre.charAt(0).toUpperCase();
  }

  getProductColor(productName: string): string {
    const colors = [ '#2dd36f'];
    const index = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  }

  getProductInitial(productName: string): string {
    return productName.charAt(0).toUpperCase();
  }

  // 🔄 MÉTODOS PARA OBTENER PROPIEDADES SEGURAS DE LA CATEGORÍA SELECCIONADA
  getSelectedCategoryId(): string {
    if (!this.selectedCategory || this.selectedCategory === 'all') {
      return '';
    }
    return this.selectedCategory.id || '';
  }

  getSelectedCategoryName(): string {
    if (!this.selectedCategory || this.selectedCategory === 'all') {
      return '';
    }
    return this.selectedCategory.nombre || '';
  }

  // 🔄 MÉTODOS PARA PRODUCTOS
  getProductName(producto: any): string {
    return producto.nombre || 'Sin nombre';
  }

  getProductQuantity(producto: any): number {
    return typeof producto.cantidad === 'string' ? 
           parseInt(producto.cantidad) || 0 : 
           producto.cantidad || 0;
  }

  getExpiryDate(producto: any): string | null {
    return producto.fechaVencimiento || null;
  }

  isProductLowStock(producto: any): boolean {
    const cantidad = this.getProductQuantity(producto);
    const minimoStock = typeof producto.minimoStock === 'string' ? 
                       parseInt(producto.minimoStock) || 2 : 
                       producto.minimoStock || 2;
    return cantidad <= minimoStock;
  }

  isProductExpiring(producto: any): boolean {
    const fechaVencimiento = this.getExpiryDate(producto);
    if (!fechaVencimiento) return false;
    
    try {
      const today = new Date();
      const expiryDate = new Date(fechaVencimiento);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 3 && diffDays >= 0;
    } catch (error) {
      return false;
    }
  }

  getProductStatus(producto: any): string {
    if (this.isProductExpiring(producto)) return 'Caduca pronto';
    if (this.isProductLowStock(producto)) return 'Stock bajo';
    return 'Normal';
  }

  getProductBadgeColor(producto: any): string {
    if (this.isProductExpiring(producto)) return 'danger';
    if (this.isProductLowStock(producto)) return 'warning';
    return 'success';
  }

  getTotalProductsCount(): number {
    return this.productos.filter(producto => producto.activo !== false).length;
  }

  getLowStockCount(): number {
    return this.productos.filter(producto => 
      this.isProductLowStock(producto) && producto.activo !== false
    ).length;
  }

  // 🔄 MÉTODOS PARA EDITAR Y ELIMINAR
  editarProducto(producto: any) {
    console.log('✏️ Editando producto:', producto);
    
    if (!producto.id) {
      console.error('❌ El producto no tiene ID');
      this.mostrarToast('Error: Producto sin ID', 'danger');
      return;
    }

    // ✅ CORREGIDO: Usar parámetros de ruta en lugar de state
    this.router.navigate(['/editar', producto.id]);
  }

  // ✅ AÑADIDO: Método mostrarToast que faltaba
  async mostrarToast(mensaje: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  async confirmarEliminacion(producto: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar "${producto.nombre}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.eliminarProducto(producto);
          }
        }
      ]
    });

    await alert.present();
  }

  eliminarProducto(producto: any) {
    if (!producto.id) {
      console.error('❌ No se puede eliminar: producto sin ID');
      return;
    }

    this.productosService.softDelete(producto.id).subscribe({
      next: () => {
        console.log('✅ Producto desactivado correctamente');
        this.mostrarToast('Producto eliminado correctamente', 'success');
        this.refreshData();
      },
      error: (error) => {
        console.error('❌ Error eliminando producto:', error);
        this.mostrarToast('Error al eliminar producto', 'danger');
      }
    });
  }

  // 🔄 MÉTODOS DE NAVEGACIÓN
  goToRegistro() {
    this.router.navigate(['/registro']);
  }

  gotoMenuPrincipal() {
    this.router.navigate(['/menu-principal']); 
  }
}