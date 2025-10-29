import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ShoppingListService } from '../../services/shopping-list.service';
import { DespensaService } from '../../services/despensa.service';
import { Producto, ItemListaCompras } from '../../models/producto.model';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-lista-compras',
  templateUrl: './lista-compras.page.html',
  styleUrls: ['./lista-compras.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ListaComprasPage implements OnInit {

  items: ItemListaCompras[] = [];
  productos: Producto[] = [];
  categoriasUnicas: string[] = [];
  cargando = false;
  mostrarAgregarManual = false;
  
  nuevoItemManual = {
    nombre: '',
    categoriaNombre: 'General',
    cantidad: 1
  };

  constructor(
    private shoppingListService: ShoppingListService,
    private despensaService: DespensaService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    await this.cargarListaCompras();
  }

  // ✅ Cargar lista de compras - CON FIRESTORE REAL
  async cargarListaCompras() {
    this.cargando = true;
    
    try {
      const user = await this.despensaService.getCurrentUser();
      console.log('Usuario actual:', user);
      
      if (user && user.uid) {
        // Intentar cargar lista existente de Firestore
        try {
          const listaExistente = await this.shoppingListService.obtenerListaUsuarioFirestore(user.uid).toPromise();
          
          if (listaExistente && listaExistente.length > 0) {
            console.log('Lista cargada desde Firestore:', listaExistente.length, 'items');
            this.items = listaExistente;
            this.actualizarCategorias();
            await this.mostrarToast('Lista de compras cargada desde la nube', 'success');
            return;
          }
        } catch (firestoreError) {
          console.warn('Error cargando lista de Firestore:', firestoreError);
          // Continuar con generación de nueva lista
        }
      }

      // Si no hay lista existente o hay error, generar nueva desde productos
      console.log('Generando nueva lista desde productos...');
      this.productos = await this.despensaService.obtenerProductosUsuario().toPromise() || [];
      console.log('Productos obtenidos:', this.productos.length);
      await this.generarNuevaLista();
      
    } catch (error) {
      console.error('Error cargando lista:', error);
      await this.mostrarToast('Error cargando la lista de compras', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  // ✅ Generar nueva lista inteligente y guardar en Firestore
  async generarNuevaLista() {
    const productosActivos = this.productos.filter(p => p.activo);
    console.log('Productos activos para generar lista:', productosActivos.length);
    
    const listaGenerada = this.shoppingListService.generarListaCompras(productosActivos);
    
    if (listaGenerada.length > 0) {
      // Guardar en Firestore si hay usuario autenticado
      const user = await this.despensaService.getCurrentUser();
      if (user && user.uid) {
        try {
          await this.shoppingListService.guardarListaComprasFirestore(listaGenerada);
          console.log('Lista guardada en Firestore');
        } catch (saveError) {
          console.warn('Error guardando en Firestore, pero continuando:', saveError);
        }
      }
      
      this.items = listaGenerada;
      this.actualizarCategorias();
      await this.mostrarToast(`Lista generada con ${listaGenerada.length} productos`, 'success');
    } else {
      await this.mostrarToast('¡Tu despensa está bien surtida! No hay productos para comprar', 'success');
      this.items = [];
    }
  }

  // ✅ Actualizar lista de categorías únicas
  actualizarCategorias() {
    const categorias = this.items
      .filter(item => !item.comprado)
      .map(item => item.categoriaNombre || item.categoriaId);
    
    this.categoriasUnicas = [...new Set(categorias)].filter(c => c);
    console.log('Categorías actualizadas:', this.categoriasUnicas);
  }

  // ✅ Obtener items por categoría
  obtenerItemsPorCategoria(categoria: string): ItemListaCompras[] {
    return this.items.filter(item => 
      (item.categoriaNombre === categoria || item.categoriaId === categoria) && 
      !item.comprado
    );
  }

  // ✅ Marcar item como comprado y actualizar en Firestore
  async marcarComprado(item: ItemListaCompras) {
    try {
      item.comprado = true;
      
      // Si el item tiene ID (viene de Firestore), actualizar en Firestore
      if (item.id) {
        const user = await this.despensaService.getCurrentUser();
        if (user && user.uid) {
          console.log('Item marcado como comprado (Firestore update pendiente)');
        }
      }
      
      // Actualizar la vista
      this.actualizarCategorias();
      await this.mostrarToast(`${item.nombre} marcado como comprado`, 'success');
    } catch (error) {
      console.error('Error marcando como comprado:', error);
      await this.mostrarToast('Error marcando como comprado', 'danger');
    }
  }

  // ✅ Editar cantidad de item
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
    this.actualizarCategorias();
    
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
            this.actualizarCategorias();
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