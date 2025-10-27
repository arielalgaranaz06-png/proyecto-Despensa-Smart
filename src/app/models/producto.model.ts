export interface Producto {
  id?: string;
  nombre?: string;
  creadoEn?: string; // ISO timestamp
  [key: string]: any;
}
