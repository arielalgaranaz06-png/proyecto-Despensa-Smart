import { Producto } from "../models/producto.model";

export class FirestoreMapear {
    //Convierte el protucto tipo JSON a un formtato leible por Firestore
    static productoToFirestore(p: Producto) {
        const fields: any = {
        nombre: { stringValue: p.nombre },
        precio: { doubleValue: p.precio },
        };
        if (p.creadoEn) fields.creadoEn = { timestampValue: p.creadoEn };

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
        };
    }
}