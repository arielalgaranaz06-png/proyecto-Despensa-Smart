import { Producto } from "../models/producto.model";

export class FirestoreMapear {
    //Convierte el protucto tipo JSON a un formtato leible por Firestore
    static productoToFirestore(p: Producto) {
        const fields: any = {};
        // Helper para convertir a ISO con zona (termina con 'Z') si es posible
        const toIso = (val: any): string | undefined => {
            if (val === undefined || val === null || val === '') return undefined;
            if (val instanceof Date) return val.toISOString();
            const s = String(val);
            // Si ya parece tener zona 'Z' o un offset (+/-), intentar parse directo
            // new Date(s) aceptará ambos formatos; si no es válido, devolvemos undefined
            const d = new Date(s);
            if (isNaN(d.getTime())) return undefined;
            return d.toISOString();
        };

        // Campos base
        if (p.nombre !== undefined) fields.nombre = { stringValue: p.nombre };
        if (p.precio !== undefined) fields.precio = { doubleValue: p.precio };
        // Campos adicionales
        if (p.cantidad !== undefined) fields.cantidad = { doubleValue: p.cantidad };
        const fechaCadIso = toIso(p.fechaCaducidad);
        if (fechaCadIso) fields.fechaCaducidad = { timestampValue: fechaCadIso };
        if (p.nombreProducto) fields.nombreProducto = { stringValue: p.nombreProducto };
        if (p.precioTexto !== undefined) fields.precioTexto = { stringValue: p.precioTexto };
        if (p.unidadMedida) fields.unidadMedida = { stringValue: p.unidadMedida };
        if (p.fechaCreacion) fields.fechaCreacion = { stringValue: p.fechaCreacion };
        const creadoIso = toIso(p.creadoEn);
        if (creadoIso) fields.creadoEn = { timestampValue: creadoIso };

        return { fields };
    }

    // Convierte el documento de Firestore a un producto tipo JSON
    static productoFromFirestore(doc: any): Producto {
        const f = doc.fields ?? {};
        return {
        id: doc.name?.split("/").pop(),
        nombre: f.nombre?.stringValue ?? "",
        precio: f.precio?.doubleValue ?? 0,
        creadoEn: f.creadoEn?.timestampValue,
        cantidad: f.cantidad?.doubleValue,
        fechaCaducidad: f.fechaCaducidad?.timestampValue,
        nombreProducto: f.nombreProducto?.stringValue,
        precioTexto: f.precioTexto?.stringValue,
        unidadMedida: f.unidadMedida?.stringValue,
        fechaCreacion: f.fechaCreacion?.stringValue,
        };
    }
}