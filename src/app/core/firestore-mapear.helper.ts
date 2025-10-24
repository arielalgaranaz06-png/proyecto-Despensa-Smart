import { Item } from '../models/item.model';

export class FirestoreMapear {
  static itemToFirestore(i: Item) {
    const fields: any = {
      name: { stringValue: i.name },
      qty: { doubleValue: i.qty },
    };
    if (i.note) fields.note = { stringValue: i.note };
    if (i.creadoEn) fields.creadoEn = { timestampValue: i.creadoEn };
    return { fields };
  }

  static itemFromFirestore(doc: any): Item {
    const f = doc.fields ?? {};
    return {
      id: doc.name?.split('/').pop(),
      name: f.name?.stringValue ?? '',
      qty: f.qty?.doubleValue ?? 0,
      note: f.note?.stringValue,
      creadoEn: f.creadoEn?.timestampValue
    };
  }
}
