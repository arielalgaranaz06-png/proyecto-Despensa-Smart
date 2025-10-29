import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, orderBy } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Producto } from '../models/producto.model';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class DespensaService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) { }

  // ✅ Obtener productos REALES del usuario desde Firestore - VERSIÓN CORREGIDA
  obtenerProductosUsuario(): Observable<Producto[]> {
    return new Observable<Producto[]>(observer => {
      // Usar onAuthStateChanged en lugar de authState
      const unsubscribe = this.auth.onAuthStateChanged(async (user) => {
        if (!user) {
          observer.error('Usuario no autenticado');
          return;
        }

        try {
          const despensaRef = collection(this.firestore, 'despensa');
          const q = query(
            despensaRef, 
            where('usuarioId', '==', user.uid), // ✅ user.uid ahora funciona
            where('active', '==', true),
            orderBy('fechaRegistro', 'desc')
          );

          const productos$ = collectionData(q, { idField: 'id' }).pipe(
            map((productos: any[]) => {
              return productos.map(productoFirestore => this.mapearProductoDesdeFirestore(productoFirestore));
            })
          );

          productos$.subscribe({
            next: (productos) => observer.next(productos),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });

        } catch (error) {
          observer.error(error);
        }
      });

      // Retornar función de limpieza
      return () => unsubscribe();
    });
  }

  // ✅ Mapear datos de Firestore a nuestro modelo Producto
  private mapearProductoDesdeFirestore(data: any): Producto {
    return {
      id: data.id,
      nombre: data.nombre || '',
      cantidad: data.cantidad || 0,
      categoriaId: data.categoriaId || '',
      fechaVencimiento: data.fechaVencimiento || '',
      minimoStock: data.minimostock || data.minimoStock || 1,
      activo: data.active || data.activo || true,
      fechaRegistro: data.fechaRegistro || new Date().toISOString(),
      fechaModificacion: data.fechaModificacion || new Date().toISOString(),
      categoria: data.categoria || null,
      tipo: data.tipo || '',
      precio: data.precio || 0,
      fecholvercimiento: data.fecholvercimiento || ''
    };
  }

  // ✅ Obtener categorías desde Firestore
  obtenerCategorias(): Observable<any[]> {
    const categoriasRef = collection(this.firestore, 'categories');
    const q = query(categoriasRef, where('esPredeterminada', '==', true));
    
    return collectionData(q, { idField: 'id' });
  }

  // ✅ Obtener usuario actual - VERSIÓN CORREGIDA
  async getCurrentUser(): Promise<any> {
    return new Promise((resolve) => {
      const unsubscribe = this.auth.onAuthStateChanged(user => {
        unsubscribe(); // Limpiar suscripción inmediatamente
        resolve(user);
      });
    });
  }
}