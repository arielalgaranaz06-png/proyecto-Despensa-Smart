import { Producto } from '../models/producto.model';

export const FirestoreMapear = {
  productoFromFirestore(doc: any): Producto {
    // doc can be a document resource or a documents[] entry
    const fields = (doc && doc.fields) ? doc.fields : {};
    const getString = (f: any) => (f ? (f.stringValue ?? f.timestampValue ?? f.integerValue ?? f.doubleValue ?? null) : null);
    const producto: Producto = {
      id: doc && doc.name ? doc.name.split('/').pop() : (doc && doc.documentId) || undefined,
      nombre: getString(fields.nombre) ?? '',
      creadoEn: getString(fields.creadoEn) ?? undefined,
    };
    // include other fields generically
    Object.keys(fields || {}).forEach(k => {
      if (!(k in producto)) {
        producto[k] = getString((fields as any)[k]);
      }
    });

    return producto;
  },

  productoToFirestore(prod: Producto) {
    const fields: any = {};
    if (prod.nombre !== undefined) fields.nombre = { stringValue: String(prod.nombre) };
    if (prod.creadoEn !== undefined) fields.creadoEn = { timestampValue: String(prod.creadoEn) };
    // map other keys as stringValues by default
    Object.keys(prod).forEach(k => {
      if (['id','nombre','creadoEn'].includes(k)) return;
      const v = (prod as any)[k];
      if (v === undefined || v === null) return;
      fields[k] = { stringValue: String(v) };
    });

    return { fields };
  }
};
