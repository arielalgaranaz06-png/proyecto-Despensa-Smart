import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonButton, IonIcon, IonFab, IonFabButton, IonFabList,
  IonBadge, IonSpinner, AlertController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ProductosService } from '../../../services/productos.service';
import { CategoriasService } from '../../../services/categorias.service';
import { Categoria } from '../../../models/categoria.model';

@Component({
  selector: 'app-lista',
  templateUrl: './lista.page.html',
  styleUrls: ['./lista.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonButton, IonIcon, IonFab, IonFabButton, IonFabList,
    IonBadge, IonSpinner,
    CommonModule, FormsModule
  ]
})
export class ListaPage implements OnInit {
  productos: any[] = [];
  categorias: Categoria[] = [];
  selectedCategory: Categoria | 'all' | null = null;
  isLoading: boolean = true;

  // Colores para categorías
  private categoryColors = [
    '#3880ff', '#3dc2ff', '#5260ff', '#2dd36f', '#ffc409',
    '#eb445a', '#92949c', '#575757', '#0cd1e8', '#7044ff'
  ];

  constructor(
    private router: Router,
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadData();
  }

  // 🔄 Método que se ejecuta cada vez que la página se vuelve activa
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
        console.log('✅ Productos cargados en loadData:', this.productos.length);
        
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

  // 🔄 Método para refrescar datos manualmente y automáticamente
  refreshData() {
    console.log('🔄 Ejecutando refreshData...');
    this.isLoading = true;
    
    // Forzar recarga de productos desde Firestore
    this.productosService.refreshProducts().subscribe({
      next: (productos) => {
        this.productos = productos;
        console.log('✅ Productos actualizados después del refresh:', this.productos.length);
        
        // También refrescar categorías por si acaso
        this.categoriasService.getAll().subscribe({
          next: (categorias) => {
            this.categorias = categorias;
            this.isLoading = false;
            console.log('✅ Refresh completado - Productos:', this.productos.length, 'Categorías:', this.categorias.length);
          },
          error: (error) => {
            console.error('❌ Error cargando categorías en refresh:', error);
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

  // 🔄 MÉTODOS PARA ESTADÍSTICAS (solo los necesarios para las categorías)
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
    return this.productos.filter(producto => producto.activo !== false).length > 0;
  }

  // 🔄 MÉTODOS PARA UI
  getCategoryColor(categoriaId: string): string {
    const index = categoriaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.categoryColors[index % this.categoryColors.length];
  }

  getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      'frutas': 'nutrition-outline',
      'verduras': 'leaf-outline',
      'lácteos': 'water-outline',
      'carnes': 'restaurant-outline',
      'bebidas': 'wine-outline',
      'granos': 'egg-outline',
      'condimentos': 'flask-outline',
      'limpieza': 'sparkles-outline',
      'bekidas': 'wine-outline'
    };

    const lowerName = categoryName.toLowerCase();
    return iconMap[lowerName] || 'cube-outline';
  }

  getProductColor(productName: string): string {
    const colors = ['#3880ff', '#3dc2ff', '#5260ff', '#2dd36f', '#ffc409', '#eb445a'];
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
    this.router.navigate(['/editar-producto'], { 
      state: { 
        producto: producto,
        categorias: this.categorias 
      } 
    });
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
        this.refreshData(); // Refrescar para ver los cambios
      },
      error: (error) => {
        console.error('❌ Error eliminando producto:', error);
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