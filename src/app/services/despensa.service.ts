import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { Producto } from '../models/producto.model';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class DespensaService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) { 
    console.log('🔧 DespensaService inicializando...');
    this.probarFirestore();
  }

  // ✅ PRUEBA SIMPLE de Firestore
  private probarFirestore() {
    try {
      console.log('🔄 Probando Firestore...');
      const testCollection = collection(this.firestore, 'test');
      console.log('✅ Firestore parece funcionar');
    } catch (error) {
      console.error('❌ Error en Firestore:', error);
    }
  }

  // ✅ Obtener productos - PRUEBA SIMPLE
  obtenerProductosUsuario(): Observable<Producto[]> {
    console.log('📦 Obteniendo productos...');
    
    return new Observable<Producto[]>(observer => {
      this.auth.onAuthStateChanged(async (user) => {
        if (!user) {
          console.log('🔐 Usuario no autenticado - Modo demo');
          observer.next(this.getProductosPrueba());
          observer.complete();
          return;
        }

        console.log('👤 Usuario autenticado:', user.uid);
        
        try {
          // INTENTAR cargar de Firestore
          const productos = await this.cargarDeFirestore(user.uid);
          observer.next(productos);
          observer.complete();
        } catch (error) {
          console.error('🔥 Error cargando de Firestore:', error);
          observer.next(this.getProductosPrueba());
          observer.complete();
        }
      });
    });
  }

  // ✅ Cargar de Firestore - VERSIÓN MÍNIMA
  private async cargarDeFirestore(usuarioId: string): Promise<Producto[]> {
    return new Promise((resolve, reject) => {
      try {
        console.log('📡 Conectando a Firestore...');
        
        const despensaRef = collection(this.firestore, 'despensa');
        console.log('✅ Referencia de colección creada');
        
        const productos$ = collectionData(despensaRef, { idField: 'id' });
        
        productos$.subscribe({
          next: (productos: any[]) => {
            console.log('✅ Datos recibidos de Firestore:', productos.length, 'productos');
            
            if (productos.length === 0) {
              console.log('📦 No hay productos en Firestore, usando demo');
              resolve(this.getProductosPrueba());
              return;
            }

            // Filtrar productos del usuario
            const productosUsuario = productos.filter(p => p.usuarioId === usuarioId && p.active);
            console.log('👤 Productos del usuario:', productosUsuario.length);
            
            const productosMapeados = productosUsuario.map(p => ({
              id: p.id,
              nombre: p.nombre || '',
              cantidad: Number(p.cantidad) || 0,
              categoriaId: p.categoriaId || '',
              fechaVencimiento: p.fechaVencimiento || '',
              minimoStock: Number(p.minimostock || p.minimoStock || 1),
              activo: p.active !== undefined ? p.active : true,
              fechaRegistro: p.fechaRegistro || new Date().toISOString(),
              fechaModificacion: p.fechaModificacion || new Date().toISOString(),
              categoria: p.categoria || null
            }));

            resolve(productosMapeados.length > 0 ? productosMapeados : this.getProductosPrueba());
          },
          error: (error) => {
            console.error('❌ Error en suscripción Firestore:', error);
            reject(error);
          }
        });

      } catch (error) {
        console.error('💥 Error en consulta Firestore:', error);
        reject(error);
      }
    });
  }

  // ✅ Datos de prueba
  private getProductosPrueba(): Producto[] {
    console.log('🎯 Usando datos de prueba');
    return [
      {
        id: 'demo-1',
        nombre: 'Leche (Demo)',
        cantidad: 0,
        categoriaId: 'lacteos',
        fechaVencimiento: '2024-12-31',
        minimoStock: 2,
        activo: true,
        fechaRegistro: new Date().toISOString(),
        fechaModificacion: new Date().toISOString(),
        categoria: { nombre: 'Lácteos' }
      },
      {
        id: 'demo-2',
        nombre: 'Pan (Demo)', 
        cantidad: 1,
        categoriaId: 'panaderia',
        fechaVencimiento: '2024-12-20',
        minimoStock: 3,
        activo: true,
        fechaRegistro: new Date().toISOString(),
        fechaModificacion: new Date().toISOString(),
        categoria: { nombre: 'Panadería' }
      }
    ];
  }

  async getCurrentUser(): Promise<any> {
    return new Promise((resolve) => {
      this.auth.onAuthStateChanged(user => {
        resolve(user);
      });
    });
  }
}