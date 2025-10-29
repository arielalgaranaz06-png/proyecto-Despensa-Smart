import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AlertController, ToastController } from '@ionic/angular';
import { Producto, ItemListaCompras } from '../../models/producto.model';

@Component({
  selector: 'app-lista-compras',
  templateUrl: './lista-compras.page.html',
  styleUrls: ['./lista-compras.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ListaComprasPage implements OnInit {

  items: ItemListaCompras[] = [];
  cargando = false;
  mostrarAgregarManual = false;
  
  nuevoItemManual = {
    nombre: '',
    categoriaNombre: 'General',
    cantidad: 1
  };

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    await this.cargarListaCompras();
  }

  // ✅ Cargar lista de compras - SIN FIREBASE
  async cargarListaCompras() {
    this.cargando = true;
    
    try {
      // Datos de prueba estáticos
      const productosPrueba: Producto[] = [
        {
          id: '1',
          nombre: 'Leche',
          cantidad: 0, // ✅ Agotado - debería aparecer
          categoriaId: 'lacteos',
          fechaVencimiento: '2024-12-31',
          minimoStock: 2,
          activo: true,
          fechaRegistro: new Date().toISOString(),
          fechaModificacion: new Date().toISOString(),
          categoria: { nombre: 'Lácteos' }
        },
        {
          id: '2',
          nombre: 'Pan',
          cantidad: 1, // ✅ Stock bajo - debería aparecer
          categoriaId: 'panaderia',
          fechaVencimiento: '2024-12-20',
          minimoStock: 3,
          activo: true,
          fechaRegistro: new Date().toISOString(),
          fechaModificacion: new Date().toISOString(),
          categoria: { nombre: 'Panadería' }
        },
        {
          id: '3',
          nombre: 'Arroz',
          cantidad: 5, // ✅ Stock normal - NO debería aparecer
          categoriaId: 'granos',
          fechaVencimiento: '2025-01-15',
          minimoStock: 2,
          activo: true,
          fechaRegistro: new Date().toISOString(),
          fechaModificacion: new Date().toISOString(),
          categoria: { nombre: 'Granos' }
        },
        {
          id: '4',
          nombre: 'Yogurt',
          cantidad: 2, // ✅ Próximo a vencer - debería aparecer
          categoriaId: 'lacteos',
          fechaVencimiento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días
          minimoStock: 2,
          activo: true,
          fechaRegistro: new Date().toISOString(),
          fechaModificacion: new Date().toISOString(),
          categoria: { nombre: 'Lácteos' }
        }
      ];

      // Generar lista inteligente local
      this.items = this.generarListaComprasLocal(productosPrueba);
      
      await this.mostrarToast(`Lista generada con ${this.items.length} productos`, 'success');
      
    } catch (error) {
      console.error('Error cargando lista:', error);
      await this.mostrarToast('Error cargando la lista', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  // ✅ Generar lista inteligente localmente
  private generarListaComprasLocal(productos: Producto[]): ItemListaCompras[] {
    const listaCompras: ItemListaCompras[] = [];
    const hoy = new Date();

    productos.forEach(producto => {
      if (!producto.activo) return;

      let motivo = '';
      let prioridad: 'alta' | 'media' | 'baja' = 'media';
      let cantidadRecomendada = 1;

      // Lógica inteligente
      if (producto.cantidad <= 0) {
        motivo = 'Producto agotado';
        prioridad = 'alta';
        cantidadRecomendada = producto.minimoStock;
      } else if (producto.cantidad < producto.minimoStock) {
        motivo = `Stock bajo (${producto.cantidad}/${producto.minimoStock})`;
        prioridad = 'alta';
        cantidadRecomendada = producto.minimoStock - producto.cantidad;
      } else if (producto.fechaVencimiento) {
        const fechaVencimiento = new Date(producto.fechaVencimiento);
        const diasParaVencer = Math.floor((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasParaVencer <= 3 && diasParaVencer >= 0) {
          motivo = `Vence en ${diasParaVencer} días`;
          prioridad = 'media';
          cantidadRecomendada = 1;
        } else if (diasParaVencer < 0) {
          motivo = 'Producto vencido';
          prioridad = 'alta';
          cantidadRecomendada = 1;
        }
      }

      if (motivo) {
        listaCompras.push({
          nombre: producto.nombre,
          categoriaId: producto.categoriaId,
          categoriaNombre: producto.categoria?.nombre || 'General',
          cantidadRecomendada: cantidadRecomendada,
          cantidadUsuario: cantidadRecomendada,
          prioridad: prioridad,
          comprado: false,
          usuarioId: 'usuario-local',
          esManual: false,
          motivo: motivo,
          productoId: producto.id
        });
      }
    });

    // Organizar por categoría
    return listaCompras.sort((a, b) => (a.categoriaNombre || '').localeCompare(b.categoriaNombre || ''));
  }

  // ✅ Obtener categorías únicas
  get categoriasUnicas(): string[] {
    const categorias = this.items
      .filter(item => !item.comprado)
      .map(item => item.categoriaNombre || 'General');
    
    return [...new Set(categorias)].filter(c => c);
  }

  // ✅ Obtener items por categoría
  obtenerItemsPorCategoria(categoria: string): ItemListaCompras[] {
    return this.items.filter(item => 
      (item.categoriaNombre === categoria) && !item.comprado
    );
  }

  // ✅ Marcar item como comprado
  async marcarComprado(item: ItemListaCompras) {
    item.comprado = true;
    await this.mostrarToast(`${item.nombre} marcado como comprado`, 'success');
  }

  // ✅ Editar cantidad
  async editarCantidad(item: ItemListaCompras) {
    const alert = await this.alertController.create({
      header: 'Editar Cantidad',
      inputs: [{
        name: 'cantidad',
        type: 'number',
        value: item.cantidadUsuario,
        min: 1,
        placeholder: 'Cantidad'
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevaCantidad = parseInt(data.cantidad);
            if (nuevaCantidad > 0) {
              item.cantidadUsuario = nuevaCantidad;
              this.mostrarToast('Cantidad actualizada', 'success');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // ✅ Agregar item manualmente
  async agregarItemManual() {
    if (!this.nuevoItemManual.nombre.trim()) {
      await this.mostrarToast('El nombre es requerido', 'warning');
      return;
    }

    const nuevoItem: ItemListaCompras = {
      nombre: this.nuevoItemManual.nombre,
      categoriaId: 'manual',
      categoriaNombre: this.nuevoItemManual.categoriaNombre,
      cantidadRecomendada: this.nuevoItemManual.cantidad,
      cantidadUsuario: this.nuevoItemManual.cantidad,
      prioridad: 'media',
      comprado: false,
      usuarioId: 'manual',
      esManual: true,
      motivo: 'Agregado manualmente'
    };

    this.items.push(nuevoItem);
    this.nuevoItemManual = { nombre: '', categoriaNombre: 'General', cantidad: 1 };
    this.mostrarAgregarManual = false;
    
    await this.mostrarToast('Producto agregado', 'success');
  }

  // ✅ Eliminar item
  async eliminarItem(item: ItemListaCompras) {
    const alert = await this.alertController.create({
      header: 'Eliminar Item',
      message: `¿Eliminar "${item.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.items = this.items.filter(i => i !== item);
            this.mostrarToast('Producto eliminado', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  // ✅ Regenerar lista
  async regenerarLista() {
    await this.cargarListaCompras();
  }

  // ✅ Helper: Mostrar toast
  private async mostrarToast(mensaje: string, color: any = 'success') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  // ✅ Helper: Obtener color según prioridad
  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baja': return 'success';
      default: return 'medium';
    }
  }

  // ✅ Alternar formulario manual
  toggleAgregarManual() {
    this.mostrarAgregarManual = !this.mostrarAgregarManual;
  }
}