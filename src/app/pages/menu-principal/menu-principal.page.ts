import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton,
  IonIcon, IonCard,
IonBadge, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  logOutOutline, cubeOutline, alertCircleOutline, 
  basketOutline, bookOutline, settingsOutline, 
  chevronForwardOutline,
  calendarOutline,
  cashOutline,
  pricetagOutline,
  arrowForwardOutline,
  warningOutline
} from 'ionicons/icons';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-menu-principal',
  templateUrl: './menu-principal.page.html',
  styleUrls: ['./menu-principal.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton,
    IonIcon, IonCard, 
    IonBadge, IonSpinner, CommonModule, FormsModule
  ],
  providers: [DatePipe]
})
export class MenuPrincipalPage implements OnInit {
  totalProductos: number = 0;
  productosPorAgotarse: number = 0;
  productosRecientes: any[] = [];
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private productosService: ProductosService,
    private datePipe: DatePipe
  ) {
    addIcons({
      logOutOutline,
      cubeOutline,
      alertCircleOutline,
      basketOutline,
      bookOutline,
      settingsOutline,
      warningOutline,
      arrowForwardOutline,
      pricetagOutline,
      cashOutline,
      calendarOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadProductos();
  }

  loadProductos() {
    this.isLoading = true;
    this.productosService.getAll().subscribe({
      next: (productos) => {
        // Asegurarse de que productos es un array
        const productosArray = Array.isArray(productos) ? productos : [];
        
        this.totalProductos = productosArray.length;
        this.productosPorAgotarse = this.calculateLowStockProducts(productosArray);
        this.productosRecientes = this.getRecentProducts(productosArray);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  calculateLowStockProducts(productos: any[]): number {
    return productos.filter(producto => {
      // Usar el campo 'live cantidad' de tu base de datos
      const cantidad = producto['live cantidad'] || producto.cantidad || 0;
      return cantidad <= 2; // Productos con 2 o menos unidades
    }).length;
  }

  getRecentProducts(productos: any[]): any[] {
    // Ordenar por fecha de registro (más recientes primero)
    return productos
      .sort((a, b) => {
        // Usar 'fechabagistro' (fecha de registro) de tu base de datos
        const dateA = a.fechabagistro ? new Date(a.fechabagistro).getTime() : 0;
        const dateB = b.fechabagistro ? new Date(b.fechabagistro).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3); // Últimos 3 productos
  }

  isProductLowStock(producto: any): boolean {
    const cantidad = producto['live cantidad'] || producto.cantidad || 0;
    return cantidad <= 2;
  }

  isProductExpiring(producto: any): boolean {
    // Usar 'fecholvercimiento' (fecha de vencimiento) de tu base de datos
    if (!producto.fecholvercimiento) return false;
    
    const today = new Date();
    const expiryDate = new Date(producto.fecholvercimiento);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 3; // Caduca en 3 días o menos
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

  getProductName(producto: any): string {
    // Obtener el nombre del producto
    return producto.nombre || producto.name || 'Sin nombre';
  }

  getProductQuantity(producto: any): number {
    // Obtener la cantidad del producto
    return producto['live cantidad'] || producto.cantidad || 0;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return this.datePipe.transform(dateString, 'dd/MM/yyyy') || '';
  }

  goToDespensa() {
    this.router.navigate(['/lista']);
  }

  goToRecetas() {
    this.router.navigate(['/recetas']);
  }

  goToConfiguracion() {
    this.router.navigate(['/configuracion']);
  }

  logout() {
    // Clear local storage
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    
    // Optional: Clear any other session data
    sessionStorage.clear();
    
    // Navigate to login page
    this.router.navigate(['/login'], {
      replaceUrl: true // This prevents going back to protected pages
    });
  }
}