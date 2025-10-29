import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, where } from '@angular/fire/firestore';
import { Observable, of, map, catchError } from 'rxjs';
import { Producto, ItemListaCompras } from '../models/producto.model';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) { 
    console.log('ShoppingListService inicializado');
  }

  // ✅ Método para verificar que el servicio funciona
  testService(): string {
    return 'ShoppingListService está funcionando correctamente';
  }

  // ✅ Generar lista de compras inteligente
  generarListaCompras(productos: Producto[]): ItemListaCompras[] {
    console.log('Generando lista de compras con', productos.length, 'productos');
    
    const listaCompras: ItemListaCompras[] = [];
    const hoy = new Date();

    // Filtrar solo productos activos
    const productosActivos = productos.filter(p => p.activo);
    
    productosActivos.forEach(producto => {
      const motivo = this.obtenerMotivoInclusion(producto, hoy);
      
      if (motivo) {
        const item = this.crearItemLista(producto, motivo);
        listaCompras.push(item);
        console.log('Producto agregado a lista:', producto.nombre, '- Motivo:', motivo);
      }
    });

    const listaOrganizada = this.organizarPorCategoria(listaCompras);
    console.log('Lista generada con', listaOrganizada.length, 'items');
    
    return listaOrganizada;
  }

  // ✅ Determinar el motivo de inclusión en la lista
  private obtenerMotivoInclusion(producto: Producto, hoy: Date): string | null {
    // 1. Productos agotados
    if (producto.cantidad <= 0) {
      return 'Producto agotado';
    }

    // 2. Productos por debajo del stock mínimo
    if (producto.cantidad < producto.minimoStock) {
      return `Stock bajo (${producto.cantidad}/${producto.minimoStock})`;
    }

    // 3. Verificar fecha de vencimiento
    const fechaVencimiento = this.obtenerFechaVencimiento(producto);
    if (fechaVencimiento) {
      const diasParaVencer = Math.floor((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasParaVencer <= 3 && diasParaVencer >= 0) {
        return `Vence en ${diasParaVencer} días`;
      }
      
      if (diasParaVencer < 0) {
        return 'Producto vencido';
      }
    }

    return null;
  }

  // ✅ Obtener fecha de vencimiento (maneja ambos campos posibles)
  private obtenerFechaVencimiento(producto: Producto): Date | null {
    // Priorizar fechaVencimiento, luego fecholvercimiento
    const fechaString = producto.fechaVencimiento || producto.fecholvercimiento;
    
    if (!fechaString) return null;
    
    try {
      const fecha = new Date(fechaString);
      return isNaN(fecha.getTime()) ? null : fecha;
    } catch (error) {
      console.warn('Fecha de vencimiento inválida:', fechaString);
      return null;
    }
  }

  // ✅ Crear item de lista
  private crearItemLista(producto: Producto, motivo: string): ItemListaCompras {
    const user = this.auth.currentUser;
    
    let cantidadRecomendada = 1;
    let prioridad: 'alta' | 'media' | 'baja' = 'media';

    // Lógica de cantidad recomendada
    if (producto.cantidad <= 0) {
      cantidadRecomendada = producto.minimoStock;
      prioridad = 'alta';
    } else if (producto.cantidad < producto.minimoStock) {
      cantidadRecomendada = producto.minimoStock - producto.cantidad;
      prioridad = 'alta';
    } else if (motivo.includes('vence') || motivo.includes('vencido')) {
      cantidadRecomendada = 1;
      prioridad = motivo.includes('vencido') ? 'alta' : 'media';
    }

    return {
      nombre: producto.nombre,
      categoriaId: producto.categoriaId,
      categoriaNombre: producto.categoria?.nombre || 'General',
      cantidadRecomendada: cantidadRecomendada,
      cantidadUsuario: cantidadRecomendada,
      prioridad: prioridad,
      comprado: false,
      usuarioId: user?.uid || 'temp-user',
      esManual: false,
      motivo: motivo,
      productoId: producto.id
    };
  }

  // ✅ Organizar por categoría
  private organizarPorCategoria(lista: ItemListaCompras[]): ItemListaCompras[] {
    return lista.sort((a, b) => {
      const catA = a.categoriaNombre || a.categoriaId;
      const catB = b.categoriaNombre || b.categoriaId;
      return catA.localeCompare(catB);
    });
  }

  // ✅ Guardar lista en Firestore REAL
  async guardarListaComprasFirestore(items: ItemListaCompras[]): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.log('🔐 Usuario no autenticado - Lista no guardada');
      return;
    }

    try {
      // Primero, limpiar lista anterior del usuario
      const listaExistente = await this.obtenerListaUsuarioFirestore(user.uid).toPromise();
      
      if (listaExistente && listaExistente.length > 0) {
        const deletePromises = listaExistente.map((item: ItemListaCompras) => {
          if (item.id) {
            return deleteDoc(doc(this.firestore, 'listaCompra', item.id));
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
      }

      // Agregar nueva lista a la colección listaCompra
      const listaRef = collection(this.firestore, 'listaCompra');
      const addPromises = items.map(item => 
        addDoc(listaRef, {
          nombre: item.nombre,
          categoriaId: item.categoriaId,
          categoriaNombre: item.categoriaNombre,
          cantidad: item.cantidadUsuario,
          comprado: item.comprado,
          prioridad: this.mapearPrioridadANumero(item.prioridad),
          usuarioId: user.uid,
          esManual: item.esManual,
          motivo: item.motivo,
          fechaCreacion: new Date().toISOString(),
          fechaComprado: item.comprado ? new Date().toISOString() : null
        })
      );
      
      await Promise.all(addPromises);
      console.log('✅ Lista guardada en Firestore correctamente');
      
    } catch (error) {
      console.error('❌ Error guardando lista en Firestore:', error);
    }
  }

  // ✅ Obtener lista del usuario desde Firestore
  obtenerListaUsuarioFirestore(usuarioId: string): Observable<ItemListaCompras[]> {
    console.log('📥 Obteniendo lista de Firestore para usuario:', usuarioId);
    
    try {
      const listaRef = collection(this.firestore, 'listaCompra');
      const q = query(
        listaRef, 
        where('usuarioId', '==', usuarioId),
        where('comprado', '==', false)
      );
      
      return collectionData(q, { idField: 'id' }).pipe(
        map((items: any[]) => {
          console.log('✅ Items encontrados en listaCompra:', items.length);
          return items.map(itemFirestore => this.mapearItemDesdeFirestore(itemFirestore));
        }),
        catchError(error => {
          console.warn('⚠️ Error obteniendo lista de Firestore:', error);
          return of([]);
        })
      );
    } catch (error) {
      console.error('❌ Error en consulta listaCompra:', error);
      return of([]);
    }
  }

  // ✅ Mapear item desde Firestore
  private mapearItemDesdeFirestore(data: any): ItemListaCompras {
    return {
      id: data.id,
      nombre: data.nombre || '',
      categoriaId: data.categoriaId || '',
      categoriaNombre: data.categoriaNombre || '',
      cantidadRecomendada: data.cantidad || 1,
      cantidadUsuario: data.cantidad || 1,
      prioridad: this.mapearNumeroAPrioridad(data.prioridad || 1),
      comprado: data.comprado || false,
      usuarioId: data.usuarioId || '',
      esManual: data.esManual || false,
      motivo: data.motivo || 'Desde Firestore',
      productoId: data.productoId || ''
    };
  }

  // ✅ Mapear prioridad a número para Firestore
  private mapearPrioridadANumero(prioridad: string): number {
    switch (prioridad) {
      case 'alta': return 2;
      case 'media': return 1;
      case 'baja': return 0;
      default: return 1;
    }
  }

  // ✅ Mapear número a prioridad
  private mapearNumeroAPrioridad(numero: number): 'alta' | 'media' | 'baja' {
    switch (numero) {
      case 2: return 'alta';
      case 1: return 'media';
      case 0: return 'baja';
      default: return 'media';
    }
  }
}