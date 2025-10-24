import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item } from '../models/item.model';
import { AuthRestService } from './auth-rest.service';
import { FirestoreMapear } from '../core/firestore-mapear.helper';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private base = `https://firestore.googleapis.com/v1/projects/${environment.firebaseConfig.projectId}/databases/(default)/documents`;
  private collection = 'despensa';

  constructor(private http: HttpClient, private auth: AuthRestService) {}

  private headers() {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  getAll(): Observable<Item[]> {
    return this.http.get<any>(`${this.base}/${this.collection}`, { headers: this.headers() }).pipe(
      map(resp => (resp.documents ?? []).map((d: any) => FirestoreMapear.itemFromFirestore(d)))
    );
  }

  create(item: Item): Observable<Item> {
    const body = FirestoreMapear.itemToFirestore(item);
    return this.http.post<any>(`${this.base}/${this.collection}`, body, { headers: this.headers() }).pipe(
      map(doc => FirestoreMapear.itemFromFirestore(doc))
    );
  }

  update(id: string, item: Partial<Item>): Observable<Item> {
    const body = FirestoreMapear.itemToFirestore(item as Item);
    let params = new HttpParams();
    Object.keys(body.fields).forEach(k => params = params.append('updateMask.fieldPaths', k));
    return this.http.patch<any>(`${this.base}/${this.collection}/${id}`, body, { headers: this.headers(), params }).pipe(
      map(doc => FirestoreMapear.itemFromFirestore(doc))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${this.collection}/${id}`, { headers: this.headers() });
  }
}
