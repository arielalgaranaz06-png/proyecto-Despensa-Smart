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
  fecholvercimiento?: string; // Posible error de escritura en la base de datos
}