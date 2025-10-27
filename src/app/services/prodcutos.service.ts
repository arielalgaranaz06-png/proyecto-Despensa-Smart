import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthRestService } from './auth-rest.service';
import { map, Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { FirestoreMapear } from '../core/firestore-mapear.helper';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private base = `https://firestore.googleapis.com/v1/projects/${environment.firebase?.projectId}/databases/(default)/documents`;
  private collection = 'productos';

  constructor(
    private http: HttpClient,
    private auth: AuthRestService
  ) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  getAll(): Observable<Producto[]> {
    const url = `${this.base}/${this.collection}`;
    return this.http.get<any>(url, { headers: this.headers() }).pipe(
      map(resp => (resp.documents ?? []).map((d: any) => FirestoreMapear.productoFromFirestore(d)))
    );
  }

  getById(id: string): Observable<Producto> {
    const url = `${this.base}/${this.collection}/${id}`;
    return this.http.get<any>(url,{ headers: this.headers() }).pipe(
      map(doc => FirestoreMapear.productoFromFirestore(doc))
    );
  }

  create(prod: Producto): Observable<Producto> {
    const url = `${this.base}/${this.collection}`;
    const body = FirestoreMapear.productoToFirestore({
      ...prod,
      creadoEn: prod.creadoEn ?? new Date().toISOString()
    });
    return this.http.post<any>(url,body ,{ headers: this.headers() }).pipe(
      map(doc => FirestoreMapear.productoFromFirestore(doc))
    );
  }

  update(id: string, partial: Partial<Producto>): Observable<Producto> {
    const url = `${this.base}/${this.collection}/${id}`;
    const body = FirestoreMapear.productoToFirestore(partial as Producto);

    const fields = Object.keys((body as any).fields || {});
    let params = new HttpParams();
    fields.forEach(k => params = params.append('updateMask.fieldPaths', k));

    return this.http.patch<any>(url, body, { headers: this.headers(), params }).pipe(
      map(doc => FirestoreMapear.productoFromFirestore(doc))
    );
  }

  put(id: string, full: Producto): Observable<Producto> {
    const url = `${this.base}/${this.collection}/${id}`;
    return this.http.put<any>(url, FirestoreMapear.productoToFirestore(full), { headers: this.headers() }).pipe(
      map(doc => FirestoreMapear.productoFromFirestore(doc))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.base}/${this.collection}/${id}`;
    return this.http.delete<void>(url, { headers: this.headers() });
  }
}
