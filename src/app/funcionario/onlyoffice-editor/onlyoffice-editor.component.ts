import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentoArchivoService } from '../../core/services/documento-archivo.service';
import { mensajeAmigable } from '../../core/utils/error-messages';

declare global {
  interface Window {
    DocsAPI?: { DocEditor: new (id: string, config: unknown) => { destroyEditor?: () => void } };
  }
}

@Component({
  selector: 'app-onlyoffice-editor',
  template: `
    <!-- Overlay a pantalla completa: cubre el navbar global para que la barra
         de acciones (Guardar y volver) quede siempre visible sobre el editor. -->
    <div style="position: fixed; inset: 0; z-index: 1080; background: #fff; display: flex; flex-direction: column">
      <div class="d-flex align-items-center gap-2 px-3 py-2 border-bottom bg-light">
        @if (modo === 'view') {
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="salir()"> Volver</button>
        } @else {
          <button
            type="button"
            class="btn btn-sm btn-primary fw-semibold"
            [disabled]="guardando() || cargando()"
            (click)="guardarYVolver()"
          >
            @if (guardando()) {
              <span class="spinner-border spinner-border-sm me-1"></span> Guardando…
            } @else {
              Guardar y volver
            }
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary"
            [disabled]="guardando()" (click)="salir()">Salir sin guardar</button>
        }
        <span class="fw-semibold ms-1">
          {{ modo === 'view' ? 'Visualización de documento' : 'Edición colaborativa de documento' }} (OnlyOffice)
        </span>
        @if (cargando()) {
          <span class="text-muted small ms-2">
            <span class="spinner-border spinner-border-sm me-1"></span> Abriendo editor…
          </span>
        }
        @if (guardadoOk()) {
          <span class="text-success small ms-2"> Guardado</span>
        }
      </div>
      @if (error()) {
        <div class="alert alert-danger m-3">{{ error() }}</div>
      }
      <div id="onlyoffice-editor" style="flex: 1; min-height: 0"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnlyofficeEditorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly docSvc = inject(DocumentoArchivoService);
  private readonly host = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    // El shell envuelve las rutas en un contenedor con `transform` (animación
    // cre-fade-in). Un ancestro con transform rompe `position:fixed` (deja de ser
    // relativo al viewport y colapsa la altura del editor). Movemos el componente
    // al <body> para que el overlay a pantalla completa funcione de verdad.
    try {
      document.body.appendChild(this.host.nativeElement);
    } catch {
      /* entorno sin DOM (SSR/tests) */
    }
  }

  readonly id = this.route.snapshot.params['id'] as string;
  readonly modo: 'edit' | 'view' =
    this.route.snapshot.queryParamMap.get('mode') === 'view' ? 'view' : 'edit';
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly guardando = signal(false);
  readonly guardadoOk = signal(false);
  private editor: { destroyEditor?: () => void } | null = null;

  constructor() {
    this.docSvc.onlyofficeConfig(this.id, this.modo).subscribe({
      next: (resp) => this.abrir(resp.serverUrl, resp.config),
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeAmigable(err));
      },
    });
  }

  private abrir(serverUrl: string, config: unknown): void {
    if (!serverUrl) {
      this.cargando.set(false);
      this.error.set('El servidor de OnlyOffice no está configurado.');
      return;
    }
    this.cargarScript(`${serverUrl.replace(/\/$/, '')}/web-apps/apps/api/documents/api.js`)
      .then(() => {
        this.cargando.set(false);
        if (!window.DocsAPI) {
          this.error.set('No se pudo cargar el editor (DocsAPI no disponible).');
          return;
        }
        this.editor = new window.DocsAPI.DocEditor('onlyoffice-editor', config);
      })
      .catch(() => {
        this.cargando.set(false);
        this.error.set('No se pudo contactar al servidor de OnlyOffice.');
      });
  }

  private cargarScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.DocsAPI) return resolve();
      const existente = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existente) {
        existente.addEventListener('load', () => resolve());
        existente.addEventListener('error', () => reject());
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.body.appendChild(s);
    });
  }

  /** Fuerza el guardado (nueva versión en S3) y recién entonces sale. */
  guardarYVolver(): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set('');
    this.docSvc.forzarGuardado(this.id).subscribe({
      next: () => {
        this.guardadoOk.set(true);
        // El DS guarda vía callback (server-to-server); damos un margen breve
        // para que la nueva versión quede persistida antes de cerrar el editor.
        setTimeout(() => this.salir(), 600);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeAmigable(err, 'No se pudo guardar el documento.'));
      },
    });
  }

  /** Cierra el editor y vuelve (sin forzar guardado). */
  salir(): void {
    try {
      this.editor?.destroyEditor?.();
    } catch {
      /* el editor ya estaba cerrado */
    }
    // El editor se abre en pestaña nueva (window.open): cerrarla devuelve al
    // expediente. Si no se abrió por script, navega a la bandeja.
    window.close();
    setTimeout(() => {
      if (!window.closed) this.router.navigate(['/funcionario/bandeja']);
    }, 150);
  }

  ngOnDestroy(): void {
    try {
      this.editor?.destroyEditor?.();
    } catch {
      /* el editor ya estaba cerrado */
    }
    // Movimos el host al <body> en ngOnInit; lo quitamos a mano para no dejarlo
    // huérfano (Angular ya no lo tiene en su contenedor original).
    this.host?.nativeElement?.remove?.();
  }
}
