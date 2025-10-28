export interface Producto {
  id?: string;   // Identificador generado para firebase
  nombre: string;
  precio: number;
  creadoEn?: string | number;
  // Campos adicionales solicitados
  cantidad?: number;
  fechaCaducidad?: string | Date;
  nombreProducto?: string;
  precioTexto?: string;
  unidadMedida?: string;
  fechaCreacion?: string;
}
