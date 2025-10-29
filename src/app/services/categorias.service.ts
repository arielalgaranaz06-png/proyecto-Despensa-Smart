import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Categoria } from '../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private baseUrl = 'https://firestore.googleapis.com/v1/projects/proyecto-despensa-smart/databases/(default)/documents/categorias';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Categoria[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map(response => {
        console.log('🔍 Respuesta CRUDA de categorías:', response);
        
        if (!response.documents) {
          console.log('📭 No hay documentos de categorías');
          return this.getCategoriasPorDefecto();
        }
        
        const categorias = response.documents.map((doc: any) => {
          try {
            const categoria = this.mapFirestoreDocumentToCategoria(doc);
            console.log('✅ Categoría mapeada:', categoria);
            return categoria;
          } catch (error) {
            console.error('❌ Error mapeando categoría:', error, doc);
            return null;
          }
        }).filter((categoria: Categoria | null) => categoria !== null);

        console.log('📂 Total categorías mapeadas:', categorias.length);
        
        // Si no hay categorías, usar las por defecto
        return categorias.length > 0 ? categorias : this.getCategoriasPorDefecto();
      }),
      catchError(error => {
        console.error('❌ Error fetching categories:', error);
        return of(this.getCategoriasPorDefecto());
      })
    );
  }

  private mapFirestoreDocumentToCategoria(doc: any): Categoria {
    const fields = doc.fields || {};
    const id = doc.name ? doc.name.split('/').pop() : '';

    console.log('📝 Mapeando campos de categoría:', fields);

    const categoria: Categoria = {
      id: id,
      nombre: fields.nombre?.stringValue || 'Sin nombre',
      esPredeterminada: fields.esPredeterminada?.booleanValue || false,
      usuarioId: fields.usuarioId?.stringValue || 'sistema'
    };

    return categoria;
  }

  getCategoriasPredeterminadas(): Observable<Categoria[]> {
    return this.getAll().pipe(
      map(categorias => categorias.filter(cat => cat.esPredeterminada))
    );
  }

  getCategoriaById(id: string): Observable<Categoria | undefined> {
    return this.getAll().pipe(
      map(categorias => categorias.find(cat => cat.id === id))
    );
  }

  private getCategoriasPorDefecto(): Categoria[] {
    return [
      { id: '1', nombre: 'Frutas', esPredeterminada: true, usuarioId: 'sistema' },
      { id: '2', nombre: 'Verduras', esPredeterminada: true, usuarioId: 'sistema' },
      { id: '3', nombre: 'Lácteos', esPredeterminada: true, usuarioId: 'sistema' },
      { id: '4', nombre: 'Carnes', esPredeterminada: true, usuarioId: 'sistema' },
      { id: '5', nombre: 'Bebidas', esPredeterminada: true, usuarioId: 'sistema' },
      { id: '6', nombre: 'Granos', esPredeterminada: true, usuarioId: 'sistema' },
      { id: '7', nombre: 'Condimentos', esPredeterminada: true, usuarioId: 'sistema' },
      { id: '8', nombre: 'Limpieza', esPredeterminada: true, usuarioId: 'sistema' }
    ];
  }
}