import { Producto } from '../models/producto.model';

export const FirestoreMapear = {
  /**
   * Convierte un documento de Firestore al modelo Producto
   * @param doc - Documento de Firestore
   * @returns Producto mapeado
   */
  productoFromFirestore(doc: any): Producto {
    console.log('🔍 Mapeando documento Firestore:', doc);
    
    // Obtener los campos del documento Firestore
    const fields = (doc && doc.fields) ? doc.fields : {};
    const id = doc && doc.name ? doc.name.split('/').pop() : undefined;

    console.log('📝 Campos del documento:', fields);

    /**
     * Función helper para obtener valores string de Firestore
     */
    const getString = (f: any): string | undefined => {
      if (!f) return undefined;
      return f.stringValue ?? 
             f.timestampValue ?? 
             f.integerValue?.toString() ?? 
             f.doubleValue?.toString() ?? 
             undefined;
    };
    
    /**
     * Función helper para obtener valores numéricos de Firestore
     */
    const getNumber = (f: any): number => {
      if (!f) return 0;
      return f.integerValue ?? 
             f.doubleValue ?? 
             (parseInt(f.stringValue) || 0);
    };
    
    /**
     * Función helper para obtener valores booleanos de Firestore
     */
    const getBoolean = (f: any): boolean => {
      if (!f) return true;
      
      if (typeof f.booleanValue === 'boolean') {
        return f.booleanValue;
      }
      
      if (typeof f.stringValue === 'string') {
        return f.stringValue === 'true';
      }
      
      return true;
    };

    // ✅ MAPEO FLEXIBLE - Busca diferentes nombres de campos posibles
    const producto: Producto = {
      id: id,
      nombre: getString(fields.nombre) || 
              getString(fields.name) || 
              'Sin nombre',
      cantidad: getNumber(fields.cantidad) || 
                getNumber(fields['live cantidad']) || 
                0,
      categoriaId: getString(fields.categoriaId) || 
                   getString(fields.categoriaID) || 
                   getString(fields.categoria) || 
                   '',
      fechaVencimiento: getString(fields.fechaVencimiento) || 
                       getString(fields.fecholvercimiento) || 
                       undefined,
      minimoStock: getNumber(fields.minimoStock) || 2,
      activo: getBoolean(fields.activo),
      fechaRegistro: getString(fields.fechaRegistro) || new Date().toISOString(),
      fechaModificacion: getString(fields.fechaModificacion) || new Date().toISOString(),
      
      // Campos adicionales que podrían existir
      precio: getNumber(fields.precio),
      tipo: getString(fields.tipo)
    };

    // ✅ Incluir otros campos genéricamente si existen
    Object.keys(fields || {}).forEach(k => {
      // Solo agregar campos que no existen en el modelo principal
      if (!(k in producto) && 
          !['nombre', 'name', 'cantidad', 'live cantidad', 'categoriaId', 'categoriaID', 'categoria', 
            'fechaVencimiento', 'fecholvercimiento', 'minimoStock', 'activo', 'fechaRegistro', 'fechaModificacion',
            'precio', 'tipo'].includes(k)) {
        const value = getString((fields as any)[k]);
        if (value !== undefined) {
          (producto as any)[k] = value;
        }
      } 
    });

    console.log('✅ Producto mapeado final:', producto);
    return producto;
  },

  /**
   * Convierte un Producto al formato de Firestore
   * @param prod - Producto a convertir
   * @returns Objeto en formato Firestore
   */
  productoToFirestore(prod: Producto) {
    console.log('🔄 Convirtiendo producto a Firestore:', prod);
    
    const fields: any = {};
    
    // ✅ Campos específicos con sus tipos EXACTOS para Firestore
    if (prod.nombre !== undefined && prod.nombre !== null) {
      fields.nombre = { stringValue: String(prod.nombre) };
    }
    
    if (prod.cantidad !== undefined && prod.cantidad !== null) {
      fields.cantidad = { integerValue: prod.cantidad };
    }
    
    if (prod.categoriaId !== undefined && prod.categoriaId !== null) {
      fields.categoriaId = { stringValue: String(prod.categoriaId) };
    }
    
    if (prod.fechaVencimiento !== undefined && prod.fechaVencimiento !== null) {
      fields.fechaVencimiento = { timestampValue: prod.fechaVencimiento };
    }
    
    if (prod.minimoStock !== undefined && prod.minimoStock !== null) {
      fields.minimoStock = { integerValue: prod.minimoStock };
    }
    
    if (prod.activo !== undefined && prod.activo !== null) {
      fields.activo = { booleanValue: prod.activo };
    }
    
    if (prod.fechaRegistro !== undefined && prod.fechaRegistro !== null) {
      fields.fechaRegistro = { timestampValue: prod.fechaRegistro };
    }
    
    if (prod.fechaModificacion !== undefined && prod.fechaModificacion !== null) {
      fields.fechaModificacion = { timestampValue: prod.fechaModificacion };
    }

    // ✅ Mapear otros campos como stringValues por defecto
    Object.keys(prod).forEach(k => {
      // Excluir campos ya mapeados específicamente
      const excludedFields = [
        'id', 'nombre', 'cantidad', 'categoriaId', 'fechaVencimiento', 
        'minimoStock', 'activo', 'fechaRegistro', 'fechaModificacion'
      ];
      
      if (excludedFields.includes(k)) return;
      
      const v = (prod as any)[k];
      if (v === undefined || v === null) return;
      
      // Determinar el tipo de campo automáticamente
      if (typeof v === 'number') {
        fields[k] = { integerValue: v };
      } else if (typeof v === 'boolean') {
        fields[k] = { booleanValue: v };
      } else if (typeof v === 'string' && this.isIsoDateString(v)) {
        fields[k] = { timestampValue: v };
      } else {
        fields[k] = { stringValue: String(v) };
      }
    });

    const result = { fields };
    console.log('✅ Firestore data result:', result);
    return result;
  },

  /**
   * Verifica si un string es una fecha ISO válida
   */
   isIsoDateString(str: string): boolean {
    if (!str) return false;
    try {
      const date = new Date(str);
      return date.toISOString() === str || !isNaN(date.getTime());
    } catch {
      return false;
    }
  },

  /**
   * Mapea una categoría desde Firestore
   */
  categoriaFromFirestore(doc: any): any {
    const fields = (doc && doc.fields) ? doc.fields : {};
    const id = doc && doc.name ? doc.name.split('/').pop() : '';

    return {
      id: id,
      nombre: fields.nombre?.stringValue || 'Sin nombre',
      esPredeterminada: fields.esPredeterminada?.booleanValue || false,
      usuarioId: fields.usuarioId?.stringValue || 'sistema'
    };
  },

  /**
   * Convierte una categoría al formato de Firestore
   */
  categoriaToFirestore(categoria: any) {
    const fields: any = {};
    
    if (categoria.nombre !== undefined && categoria.nombre !== null) {
      fields.nombre = { stringValue: String(categoria.nombre) };
    }
    
    if (categoria.esPredeterminada !== undefined && categoria.esPredeterminada !== null) {
      fields.esPredeterminada = { booleanValue: categoria.esPredeterminada };
    }
    
    if (categoria.usuarioId !== undefined && categoria.usuarioId !== null) {
      fields.usuarioId = { stringValue: String(categoria.usuarioId) };
    }

    return { fields };
  }
};