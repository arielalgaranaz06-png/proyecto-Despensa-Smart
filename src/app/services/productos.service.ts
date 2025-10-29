// productos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private baseUrl = 'https://firestore.googleapis.com/v1/projects/proyecto-despensa-smart/databases/(default)/documents/despensa';
  
  // BehaviorSubject para manejar el estado de los productos
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  public productos$ = this.productosSubject.asObservable();

  constructor(private http: HttpClient) { 
    // Cargar productos inicialmente
    this.loadInitialProducts();
  }

  private loadInitialProducts() {
    this.http.get<any>(this.baseUrl).pipe(
      map(response => {
        console.log('🔍 Respuesta CRUDA de Firestore:', response);
        
        if (!response.documents) {
          console.log('📭 No hay documentos en la respuesta');
          return [];
        }
        
        const productos = response.documents.map((doc: any) => {
          try {
            const producto = this.mapFirestoreDocumentToProducto(doc);
            console.log('✅ Producto mapeado:', producto);
            return producto;
          } catch (error) {
            console.error('❌ Error mapeando producto:', error, doc);
            return null;
          }
        }).filter((producto: Producto | null) => producto !== null);

        console.log('📦 Total productos mapeados:', productos.length);
        return productos;
      }),
      catchError(this.handleError)
    ).subscribe({
      next: (productos) => {
        this.productosSubject.next(productos);
      },
      error: (error) => {
        console.error('❌ Error cargando productos iniciales:', error);
      }
    });
  }

  getAll(): Observable<Producto[]> {
    return this.productos$;
  }

  // Método refresh para forzar actualización
  refreshProducts(): Observable<Producto[]> {
  console.log('🔄 Forzando actualización de productos...');
  return this.http.get<any>(this.baseUrl).pipe(
    map(response => {
      console.log('🔍 Respuesta CRUDA de Firestore:', response);
      
      if (!response.documents) {
        console.log('📭 No hay documentos en la respuesta');
        return [];
      }
      
      const productos = response.documents.map((doc: any) => {
        try {
          const producto = this.mapFirestoreDocumentToProducto(doc);
          console.log('✅ Producto mapeado - ID:', producto.id, 'Nombre:', producto.nombre);
          return producto;
        } catch (error) {
          console.error('❌ Error mapeando producto:', error);
          return null;
        }
      }).filter((producto: Producto | null) => producto !== null);

      console.log('📦 Total productos después del refresh:', productos.length);
      return productos;
    })
  );
}

  create(producto: Producto): Observable<any> {
    const firestoreData = {
      fields: {
        nombre: { stringValue: producto.nombre },
        cantidad: { integerValue: producto.cantidad.toString() },
        categoriaId: { stringValue: producto.categoriaId },
        fechaVencimiento: producto.fechaVencimiento ? 
          { timestampValue: new Date(producto.fechaVencimiento).toISOString() } : 
          { nullValue: null },
        minimoStock: { integerValue: (producto.minimoStock || 2).toString() },
        activo: { booleanValue: producto.activo !== undefined ? producto.activo : true },
        fechaRegistro: { timestampValue: new Date().toISOString() },
        fechaModificacion: { timestampValue: new Date().toISOString() }
      }
    };

    console.log('🚀 Enviando producto a Firestore:', firestoreData);
    return this.http.post(this.baseUrl, firestoreData).pipe(
      tap(() => {
        // Después de crear, refrescar la lista automáticamente
        console.log('✅ Producto creado, refrescando lista...');
        this.refreshProducts().subscribe({
          next: (productos) => {
            console.log('🔄 Lista actualizada después de crear producto:', productos);
          },
          error: (error) => {
            console.error('❌ Error refrescando después de crear:', error);
          }
        });
      }),
      catchError(this.handleError)
    );
  }

  // ... (los demás métodos mapFirestoreDocumentToProducto, handleError, etc. se mantienen igual)
  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en servicio Firebase:', error);
    
    let errorMessage = 'Error desconocido';
    if (error.status === 403) {
      errorMessage = 'Error 403: Permisos denegados. Verifica las reglas de Firestore.';
    } else if (error.status === 404) {
      errorMessage = 'Error 404: Recurso no encontrado. Verifica la URL.';
    } else if (error.status === 401) {
      errorMessage = 'Error 401: No autorizado. Verifica la autenticación.';
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private mapFirestoreDocumentToProducto(doc: any): Producto {
    const fields = doc.fields || {};
    const id = doc.name ? doc.name.split('/').pop() : undefined;
    console.log('🆔 ID extraído:', id);
    console.log('📝 Mapeando campos del documento:', fields);

    // Mapeo flexible de campos
    const producto: Producto = {
      id: id,
      nombre: this.getStringValue(fields.nombre) || 
              this.getStringValue(fields.name) || 
              'Sin nombre',
      cantidad: this.getNumberValue(fields.cantidad) || 
                this.getNumberValue(fields['live cantidad']) || 
                0,
      categoriaId: this.getStringValue(fields.categoriaId) || 
                   this.getStringValue(fields.categoriaID) || 
                   '',
      fechaVencimiento: this.getStringValue(fields.fechaVencimiento) || 
                       this.getStringValue(fields.fecholvercimiento) || 
                       undefined,
      minimoStock: this.getNumberValue(fields.minimoStock) || 2,
      activo: this.getBooleanValue(fields.activo) ?? true,
      fechaRegistro: this.getStringValue(fields.fechaRegistro) || new Date().toISOString(),
      fechaModificacion: this.getStringValue(fields.fechaModificacion) || new Date().toISOString(),
      
      // Campos adicionales
      precio: this.getNumberValue(fields.precio),
      tipo: this.getStringValue(fields.tipo)
    };

    return producto;
  }

  private getStringValue(field: any): string | undefined {
    if (!field) return undefined;
    return field.stringValue || 
           field.timestampValue || 
           field.integerValue?.toString() || 
           field.doubleValue?.toString() || 
           undefined;
  }

  private getNumberValue(field: any): number {
    if (!field) return 0;
    return field.integerValue || 
           field.doubleValue || 
           (parseInt(field.stringValue) || 0);
  }

  private getBooleanValue(field: any): boolean | undefined {
    if (!field) return undefined;
    
    if (typeof field.booleanValue === 'boolean') {
      return field.booleanValue;
    }
    
    if (typeof field.stringValue === 'string') {
      return field.stringValue === 'true';
    }
    
    return undefined;
  }
// productos.service.ts
// Agrega estos métodos al servicio:

update(producto: Producto): Observable<any> {
  if (!producto.id) {
    return throwError(() => new Error('Producto ID es requerido para actualizar'));
  }

  const updateUrl = `${this.baseUrl}/${producto.id}`;
  
  const firestoreData = {
    fields: {
      nombre: { stringValue: producto.nombre },
      cantidad: { integerValue: producto.cantidad.toString() },
      categoriaId: { stringValue: producto.categoriaId },
      fechaVencimiento: producto.fechaVencimiento ? 
        { timestampValue: new Date(producto.fechaVencimiento).toISOString() } : 
        { nullValue: null },
      minimoStock: { integerValue: (producto.minimoStock || 2).toString() },
      activo: { booleanValue: producto.activo },
      fechaRegistro: { timestampValue: producto.fechaRegistro },
      fechaModificacion: { timestampValue: new Date().toISOString() }
    }
  };

  console.log('✏️ Actualizando producto:', firestoreData);
  
  // Firestore REST API usa PATCH para actualizar
  return this.http.patch(updateUrl, firestoreData).pipe(
    tap(() => {
      // Refrescar después de actualizar
      this.refreshProducts().subscribe();
    }),
    catchError(this.handleError)
  );
}

softDelete(productoId: string): Observable<any> {
  if (!productoId) {
    return throwError(() => new Error('Producto ID es requerido'));
  }

  const updateUrl = `${this.baseUrl}/${productoId}`;
  
  const firestoreData = {
    fields: {
      activo: { booleanValue: false },
      fechaModificacion: { timestampValue: new Date().toISOString() }
    }
  };

  console.log('🗑️ Desactivando producto:', productoId);
  
  return this.http.patch(updateUrl, firestoreData).pipe(
    tap(() => {
      this.refreshProducts().subscribe();
    }),
    catchError(this.handleError)
  );
}

}
