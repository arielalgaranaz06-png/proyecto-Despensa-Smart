import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonSpinner, IonNote, IonCard, IonItem, IonLabel, IonItemOptions, IonItemOption, IonItemSliding, IonList, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader, IonButtons } from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular';
import { AuthRestService } from 'src/app/services/auth-rest.service';
import { ProductosService } from 'src/app/services/productos.service';
import { Producto } from 'src/app/models/producto.model';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-crud',
  templateUrl: './crud.page.html',
  styleUrls: ['./crud.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule]
})
export class CrudPage implements OnInit {
  loginForm!: FormGroup;
  productoForm!: FormGroup;

  productos = signal<Producto[]>([]);
  cargando = signal<boolean>(false);
  logueado = signal<boolean>(false);
  idToken = signal<string | null>(null);

  seleccionado = signal<Producto | null>(null);
  editando = computed(() => !!this.seleccionado());

  constructor(
    private fb: FormBuilder,
    
    private auth: AuthRestService,
    private api: ProductosService,

    private toast: ToastController,
    private alert: AlertController
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
    //Datos que se mandan a Firebase
    this.productoForm = this.fb.group({  
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      precio: [0, [Validators.required, Validators.min(1)]],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      fechaCaducidad: [''],
      nombreProducto: [''],
      unidadMedida: [''],
      fechaCreacion: [''],
    });

    // Token en memoria 
    const token = this.auth.getToken?.() as string | undefined;
    if (token) {
      this.idToken.set(token);
      this.logueado.set(true);
      this.listar();
    }
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    const { email, password } = this.loginForm.value;
    this.auth.signInEmailPassword(email, password).subscribe({
      next: async (token) => {
        this.idToken.set(token);
        this.logueado.set(true);
        await this.presentToast('Sesión iniciada');
        this.listar();
        this.cargando.set(false);
      },
      error: async (err) => {
        this.cargando.set(false);
        await this.presentToast(this.humanoError(err), 'danger');
      }
    });
  }

  async onLogout() {
    this.auth.signOut?.();
    this.idToken.set(null);
    this.logueado.set(false);
    this.productos.set([]);
    this.seleccionado.set(null);
    this.productoForm.reset({ nombre: '', precio: 0, cantidad: 0, fechaCaducidad: '', nombreProducto: '', precioTexto: '', unidadMedida: '', fechaCreacion: '' });
    await this.presentToast('Sesión cerrada');
  }

  // --- CRUD ---
  listar() {
    this.cargando.set(true);
    this.api.getAll().subscribe({
      next: (lista) => {
        this.productos.set(lista);
        this.cargando.set(false);
      },
      error: async (err) => {
        this.cargando.set(false);
        await this.presentToast(this.humanoError(err), 'danger');        
      }
    });
  }

  crear() {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();    //se cambio en fire base reglas esto " request.auth != null; ", estaba con "if false;"
      return;
    }
    this.cargando.set(true);
    const p = this.productoForm.value as Producto;
    this.api.create(p).subscribe({
      next: async (nuevo) => {
        this.productoForm.reset({ nombre: '', precio: 0, cantidad: 0, fechaCaducidad: '', nombreProducto: '', precioTexto: '', unidadMedida: '', fechaCreacion: '' });
        this.productos.set([nuevo, ...this.productos()]);
        await this.presentToast('Producto creado');
        this.cargando.set(false);
      },
      error: async (err) => {
        this.cargando.set(false);
        await this.presentToast(this.humanoError(err), 'danger');
      }
    });
  }

  seleccionar(item: Producto) {
    this.seleccionado.set(item);
    this.productoForm.patchValue({
      nombre: item.nombre,
      precio: item.precio
      , cantidad: item.cantidad ?? 0,
      fechaCaducidad: item.fechaCaducidad ?? '',
      nombreProducto: item.nombreProducto ?? '',
      precioTexto: item.precioTexto ?? '',
      unidadMedida: item.unidadMedida ?? '',
      fechaCreacion: item.fechaCreacion ?? ''
    });
  }

  editar() {
    const sel = this.seleccionado();
    if (!sel) return;

    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const cambios = this.productoForm.value as Producto;
    // Envia los datos para actualizar: normalizar tipos
    const cambiosTyped: Partial<Producto> = {
      nombre: String(cambios.nombre),
      precio: Number(cambios.precio),
      cantidad: Number(cambios.cantidad),
      fechaCaducidad: cambios.fechaCaducidad ? (cambios.fechaCaducidad instanceof Date ? cambios.fechaCaducidad.toISOString() : String(cambios.fechaCaducidad)) : undefined,
      nombreProducto: cambios.nombreProducto ? String(cambios.nombreProducto) : undefined,
      precioTexto: cambios.precioTexto !== undefined ? String(cambios.precioTexto) : undefined,
      unidadMedida: cambios.unidadMedida ? String(cambios.unidadMedida) : undefined,
      fechaCreacion: cambios.fechaCreacion ? String(cambios.fechaCreacion) : undefined
    };
  this.api.update(sel.id!, cambiosTyped).subscribe({
      next: async (actualizado) => {
        // refrescamos lista local
        const nueva = this.productos().map(p => p.id === actualizado.id ? actualizado : p);
        this.productos.set(nueva);
        this.seleccionado.set(null);
  this.productoForm.reset({ nombre: '', precio: 0, cantidad: 0, fechaCaducidad: '', nombreProducto: '', precioTexto: '', unidadMedida: '', fechaCreacion: '' });
        await this.presentToast('Producto actualizado');
        this.cargando.set(false);
      },
      error: async (err) => {
        this.cargando.set(false);
        await this.presentToast(this.humanoError(err), 'danger');
      }
    });
  }

  async borrar(item?: Producto) {
    const objetivo = item ?? this.seleccionado()!;
    if (!objetivo?.id) return;

    const ok = await this.confirmar(`¿Borrar "${objetivo.nombre}"?`);
    if (!ok) return;

    this.cargando.set(true);
    this.api.delete(objetivo.id).subscribe({
      next: async () => {
        this.productos.set(this.productos().filter(p => p.id !== objetivo.id));
        if (!item) {
          // si venía del modo edición
          this.seleccionado.set(null);
          this.productoForm.reset({ nombre: '', precio: 0, cantidad: 0, fechaCaducidad: '', nombreProducto: '', precioTexto: '', unidadMedida: '', fechaCreacion: '' });
        }
        await this.presentToast('Producto borrado');
        this.cargando.set(false);
      },
      error: async (err) => {
        this.cargando.set(false);
        await this.presentToast(this.humanoError(err), 'danger');
      }
    });
  }

  cancelarEdicion() {
    this.seleccionado.set(null);
    this.productoForm.reset({ nombre: '', precio: 0, cantidad: 0, fechaCaducidad: '', nombreProducto: '', precioTexto: '', unidadMedida: '', fechaCreacion: '' });
  }

  private async presentToast(message: string, color: 'primary'|'success'|'warning'|'danger'|'medium' = 'success') {
    const t = await this.toast.create({ message, duration: 1800, position: 'top', color });
    await t.present();
  }

  private async confirmar(message: string) {
    const a = await this.alert.create({
      header: 'Confirmar',
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sí, borrar', role: 'confirm' }
      ]
    });
    await a.present();
    const r = await a.onDidDismiss();
    return r.role === 'confirm';
  }

  private humanoError(err: any): string {
    const msg = err?.error?.error?.message || err?.message || 'Error'; 
    if (/INVALID_PASSWORD|EMAIL_NOT_FOUND/i.test(msg)) return 'Credenciales inválidas';
    if (/USER_DISABLED/i.test(msg)) return 'Usuario deshabilitado';
    return msg; 
  }
}
