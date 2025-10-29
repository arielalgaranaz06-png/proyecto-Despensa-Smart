import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonList,
  IonItem, IonCheckbox, IonSpinner, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon 
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ProductosService } from '../../services/productos.service';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { restaurant } from 'ionicons/icons';
import { Producto } from '../../models/producto.model';
import { environment } from '../../../environments/environment';

interface ProductoSeleccionable extends Producto {
  selected?: boolean;
}

@Component({
  selector: 'app-recetas',
  templateUrl: './recetas.page.html',
  styleUrls: ['./recetas.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton,
    IonList,
    IonItem,
    IonCheckbox,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
  ]
})
export class RecetasPage implements OnInit {
  productos: ProductoSeleccionable[] = [];
  isLoading: boolean = true;
  recetaGenerada: string | null = null;
  // Will store the request payload that would be sent to OpenAI
  ultimoPayload: any = null;
  // Preview of headers but with API key redacted
  headersPreview: any = null;
  mostrarPayload: boolean = false;
  // Tracks if we're currently calling the OpenAI API to prevent duplicate requests
  isRequesting: boolean = false;

  constructor(
    private router: Router,
    private productosService: ProductosService,
    private http: HttpClient
  ) {
    addIcons({ restaurant });
  }

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.isLoading = true;
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.productos = productos.map(p => ({
          ...p,
          selected: false
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.isLoading = false;
      }
    });
  }

  hayProductosSeleccionados(): boolean {
    return this.productos.some(p => p.selected);
  }

async generarReceta() {
  if (this.isRequesting) return;

  const ingredientesSeleccionados = this.productos
    .filter(p => p.selected)
    .map(p => p.nombre);

  if (ingredientesSeleccionados.length === 0) {
    this.recetaGenerada = 'Por favor, selecciona al menos un producto para generar una receta.';
    return;
  }

  this.isRequesting = true;
  this.recetaGenerada = null;

  try {
    // Simulación de una llamada (delay visual)
    await new Promise(res => setTimeout(res, 1000));

    const lista = ingredientesSeleccionados.join(' y ');
    const nombreReceta = `Receta generada para ${lista}`;

    this.recetaGenerada = `
      <strong>${nombreReceta}</strong><br><br>
      Te sugerimos preparar una deliciosa <strong>ensalada de frutas</strong> combinando ${lista}.<br><br>
      <strong>Pasos:</strong><br>
      1. Lava y corta ${lista}.<br>
      2. Mézclalos en un recipiente.<br>
      3. Agrega un toque de miel o yogur si deseas.<br>
      4. ¡Disfruta tu receta saludable y sencilla!
    `;
  } catch (error: any) {
    this.recetaGenerada = `<strong>Error:</strong> ${error?.message || String(error)}`;
  } finally {
    this.isRequesting = false;
  }
}


  
  /*async generarReceta() {
    if (this.isRequesting) return; // prevent duplicate calls
    const ingredientesSeleccionados = this.productos
      .filter(p => p.selected)
      .map(p => p.nombre)
      .join(', ');

    const prompt = `Actúa como un chef experto y genera una receta creativa usando algunos o todos estos ingredientes disponibles: ${ingredientesSeleccionados}. 
                   La receta debe incluir: 1) Nombre del plato, 2) Tiempo de preparación, 3) Porciones, 4) Ingredientes necesarios, 5) Pasos de preparación.
                   Formatea la respuesta usando HTML simple (strong, br, ul, li) para mejor presentación.`;

    // Instead of calling the OpenAI API now, build the payload and show it in the UI
    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8
    };

    // Prepare a headers preview but redact the real API key to avoid exposing it in the client UI
    const headersPreview = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer <REDACTED>'
    };

    this.ultimoPayload = payload;
    this.headersPreview = headersPreview;
    this.mostrarPayload = true;

    // llama a la api de openai 
    this.isRequesting = true;
    try {
      const maxRetries = 3;
      let attempt = 0;
      let response: Response | null = null;
      let lastError: any = null;

      while (attempt <= maxRetries) {
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${environment.openAI.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    // Clonamos para poder leer el cuerpo sin perder el stream
    const responseClone = response.clone();

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
      console.warn(`Received 429, retrying after ${delayMs}ms (attempt ${attempt + 1})`);

      // ahora leemos del clon, no del original
      let bodyText = '';
      try { bodyText = await responseClone.text(); } catch (_) { bodyText = '<no-body>'; }
      console.warn('OpenAI 429 body:', bodyText);

      attempt++;
      await new Promise(res => setTimeout(res, delayMs));
      continue; // retry
    }

    // Si no fue 429, sal del bucle
    break;
  } catch (fetchErr) {
    lastError = fetchErr;
    console.error('Network/fetch error calling OpenAI, attempt', attempt + 1, fetchErr);
    await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 500));
    attempt++;
    continue;
  }
}


      if (!response && lastError) {
        throw lastError;
      }

      // Try to parse JSON, but if parsing fails capture raw text for debugging
      let data: any = null;
      let rawText: string | null = null;
      try {
        data = await response!.json();
      } catch (parseError) {
        try { rawText = await response!.text(); } catch (tErr) { rawText = `No se pudo leer el cuerpo de la respuesta: ${String(tErr)}`; }
      }

      if (!response!.ok) {
        const serverMsg = data?.error?.message || rawText || JSON.stringify(data) || 'Respuesta vacía';
        const uiMsg = `<strong>Error ${response!.status}:</strong> ${serverMsg}`;
        console.error('OpenAI API error', { status: response!.status, body: data ?? rawText });
        this.recetaGenerada = uiMsg;
      } else if (data && data.choices && data.choices[0]) {
        this.recetaGenerada = data.choices[0].message?.content || 'Respuesta vacía';
      } else {
        const fallback = rawText || JSON.stringify(data) || 'No se recibió una respuesta válida de la IA.';
        console.warn('OpenAI returned unexpected body', { status: response!.status, body: data ?? rawText });
        this.recetaGenerada = fallback;
      }
    } catch (error: any) {
      console.error('Error llamando a OpenAI:', error);
      this.recetaGenerada = `<strong>Error:</strong> ${error?.message || String(error)}`;
    } finally {
      this.isRequesting = false;
    }
  }

  */

  gotoMenuPrincipal() {
    this.router.navigate(['/menu-principal']); 
  }
}
