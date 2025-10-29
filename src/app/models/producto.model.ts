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
  categoria?: any;
  tipo?: string;
  precio?: number;
  fecholvercimiento?: string; 
}