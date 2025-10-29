// models/producto.model.ts - MANTENER tu estructura actual
export interface Producto {
  id?: string;
  nombre: string;
  cantidad: number;
  categoriaId: string;
  fechaVencimiento?: string;
  minimoStock: number;
  activo: boolean;
  fechaRegistro: string;
  fechaModificacion: string;
  
  // Campos que podrían venir de Firestore con nombres diferentes
  categoria?: any;
  tipo?: string;
  precio?: number;
  fecholvercimiento?: string;
}

// ✅ NUEVO: Modelo para Lista de Compras
export interface ItemListaCompras {
  id?: string;
  productoId?: string;
  nombre: string;
  categoriaId: string;
  categoriaNombre?: string; // Para mostrar el nombre de la categoría
  cantidadRecomendada: number;
  cantidadUsuario: number;
  prioridad: 'alta' | 'media' | 'baja';
  comprado: boolean;
  usuarioId: string;
  esManual: boolean;
  motivo: string; // Por qué se incluyó en la lista
}