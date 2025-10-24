import { Injectable } from '@angular/core';
import { collection, getDocs, onSnapshot, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, getFirestore, Firestore, CollectionReference, DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  private firestore: Firestore;

  constructor() {
    //sdk

    this.firestore = getFirestore() as Firestore;
    this.auth = getAuth();
  }

  // obtiene una coleccion 
  getCollection<T = any>(path: string): Observable<T[]> {
    const colRef = collection(this.firestore, path) as CollectionReference<DocumentData>;
    return new Observable<T[]>(subscriber => {
      // listener 
      const unsubscribe = onSnapshot(colRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
        subscriber.next(items);
      }, err => subscriber.error(err));

      return { unsubscribe } as any;
    });
  }

  // obtiene documentos de una coleccion (vista)
  getDocument<T = any>(path: string, id: string): Observable<T | undefined> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return new Observable<T | undefined>(subscriber => {
      const unsubscribe = onSnapshot(docRef, (snap: DocumentSnapshot<DocumentData>) => {
        if (!snap.exists()) {
          subscriber.next(undefined);
        } else {
          subscriber.next({ id: snap.id, ...snap.data() } as T);
        }
      }, err => subscriber.error(err));

      return { unsubscribe } as any;
    });
  }

  // añade un documento a una coleccion
  async addDocument(path: string, data: any) {
    const colRef = collection(this.firestore, path);
    const result = await addDoc(colRef, data);
    return result.id;
  }

  
  private auth: any;

  // iniciar sesion
  async signIn(email: string, password: string) {
    const res = await signInWithEmailAndPassword(this.auth, email, password);
    return res.user as FirebaseUser;
  }

  // crear usuario con correo y contra
  async signUp(email: string, password: string) {
    const res = await createUserWithEmailAndPassword(this.auth, email, password);
    return res.user as FirebaseUser;
  }

  // cerrar sesion
  async signOut() {
    await fbSignOut(this.auth);
  }

  // cambios de estado auth 
  onAuthState(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  // guiarda el usuario en firestore
  async saveUserToFirestore(user: FirebaseUser) {
    if (!user || !user.uid) return;
    const data: any = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      lastSeen: new Date().toISOString()
    };
    await this.setDocument('users', user.uid, data);
  }

  // API REST 
  async signInWithRest(email: string, password: string) {//agarra el email y la contraseña
    const apiKey = environment.firebaseConfig.apiKey; //agarrea la api de el envieroment 
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`; //la url agarra la apikey
    const body = { email, password, returnSecureToken: true }; //envia esto a firebase
    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });//aqui se espera a una repsuesta de la base
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = text; }
    return { ok: res.ok, status: res.status, body: json };
  }

  // guarda un documento (crea  reemplaza)
  async setDocument(path: string, id: string, data: any) {
    const docRef = doc(this.firestore, `${path}/${id}`);
    await setDoc(docRef, data);
  }

  // actualiza un documento
  async updateDocument(path: string, id: string, data: any) {
    const docRef = doc(this.firestore, `${path}/${id}`);
    await updateDoc(docRef, data);
  }

  // borrar delete
  async deleteDocument(path: string, id: string) {
    const docRef = doc(this.firestore, `${path}/${id}`);
    await deleteDoc(docRef);
  }
}

