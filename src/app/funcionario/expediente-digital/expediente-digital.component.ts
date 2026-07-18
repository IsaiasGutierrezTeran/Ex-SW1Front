import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentoArchivoService } from '../../core/services/documento-archivo.service';
import { TramiteC2Service } from '../../core/services/tramite-c2.service';
import {
  DocumentoArchivo,
  SubirDocumentoRequest,
  TipoDocumento,
  TIPOS_DOCUMENTO,
} from '../../core/models/documento-archivo.model';
import { DictarSeccionComponent } from '../../shared/dictar-seccion/dictar-seccion.component';
import { DictarFormularioResponse } from '../../core/models/dictado-formulario.model';
import { mensajeAmigable } from '../../core/utils/error-messages';

import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-expediente-digital',
  imports: [RouterLink, DatePipe, DictarSeccionComponent, PageHeaderComponent],
  templateUrl: './expediente-digital.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpedienteDigitalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tramiteC2Svc = inject(TramiteC2Service);
  private readonly authSvc = inject(AuthService);
  private readonly docSvc = inject(DocumentoArchivoService);

  readonly volverUrl = computed(() =>
    this.authSvc.isAdmin() ? '/admin/historial' : '/funcionario/bandeja',
  );

  readonly mostrarAcciones = computed(() => !this.authSvc.isAdmin());

  readonly finalizado = computed(() => {
    const e = this.tramiteEstado()?.estadoActual ?? this.tramiteEstado()?.estado;
    return e === 'Aprobado' || e === 'Rechazado' || e === 'Cancelado';
  });

  readonly tramiteId = this.route.snapshot.params['id'] as string;

  readonly expediente = signal<any>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  readonly justificacion = signal('');
  readonly accionSeleccionada = signal('');
  readonly procesando = signal(false);

  readonly nodoDestinoId = signal('');
  readonly seccionesAnteriores = signal<any[]>([]);

  readonly documentosObservadosIds = signal<Set<string>>(new Set());

  readonly funcionarioDestinoId = signal('');
  readonly listaFuncionarios = signal<any[]>([]);

  readonly documentos = signal<DocumentoArchivo[]>([]);
  readonly cargandoDocumentos = signal(false);
  readonly errorDocumentos = signal('');
  readonly previewCargandoId = signal<string | null>(null);

  readonly archivoSubir = signal<File | null>(null);
  readonly tipoDocumentoSubir = signal<TipoDocumento>('PDF');
  readonly nombreLogicoSubir = signal('');
  readonly obligatorioSubir = signal(false);
  readonly subiendoDocumento = signal(false);

  // Crear documento Office en blanco (Word/Excel) para co-editar.
  readonly mostrarCrearDoc = signal(false);
  readonly nombreNuevoDoc = signal('');
  readonly tipoNuevoDoc = signal<'docx' | 'xlsx'>('docx');
  readonly creandoDoc = signal(false);

  readonly tiposDocumento = TIPOS_DOCUMENTO;

  readonly actividadActualId = computed<string | null>(
    () => this.tramiteEstado()?.nodoActual?.actividadId ?? null,
  );
  readonly nodoActualId = computed<string | null>(
    () => this.tramiteEstado()?.nodoActual?.nodoId ?? null,
  );

  readonly enParalelo = computed(
    () => this.mostrarAcciones() && this.nodoActualId() == null,
  );

  private nodoIdSeccionEditable(): string | undefined {
    const secciones = this.expediente()?.secciones ?? [];
    const ed = secciones.find((s: any) => this.esSeccionEditable(s?.infoSeccion?.estado));
    return ed?.infoSeccion?.nodoId ?? undefined;
  }

  completarSeccion(seccion: any): void {
    const nodoId = seccion?.infoSeccion?.nodoId;
    if (!nodoId) return;
    if (!confirm('¿Completar esta sección y avanzar el trámite por esta rama?')) return;
    this.procesando.set(true);
    this.error.set('');
    this.tramiteC2Svc.completarNodo(this.tramiteId, undefined, this.justificacion(), nodoId).subscribe({
      next: () => this.finalizarExitosamente('Sección completada. El trámite avanzó por esta rama.'),
      error: (err) => this.manejarError(err),
    });
  }

  readonly valoresEnEdicion = signal<Record<string, string>>({});
  readonly guardandoSeccionId = signal<string | null>(null);
  readonly guardadoOkSeccionId = signal<string | null>(null);

  readonly archivoResolucion = signal<File | null>(null);
  readonly tramiteEstado = signal<any>(null);
  readonly tieneResolucion = computed(() => !!this.tramiteEstado()?.documentoResolucionId);
  readonly hayPendienteRecepcion = computed(() =>
    (this.expediente()?.secciones ?? []).some(
      (s: any) => s.infoSeccion?.estado === 'Pendiente de recepcion',
    ),
  );

  readonly decisionSiguiente = computed<any>(() => this.tramiteEstado()?.decisionSiguiente ?? null);
  readonly respuestaDecision = signal('');

  readonly mostrarDecision = computed<boolean>(
    () => !!this.decisionSiguiente() && !this.hayPendienteRecepcion(),
  );

  readonly salidasActividad = computed<string[]>(
    () => this.tramiteEstado()?.nodoActual?.salidasPosibles ?? [],
  );
  readonly sinRestriccionSalidas = computed(() => this.salidasActividad().length === 0);
  readonly puedeAvanzar = computed(
    () =>
      this.sinRestriccionSalidas() ||
      this.salidasActividad().some((s) => s === 'aprobar' || s === 'completar' || s === 'derivar'),
  );
  readonly puedeRechazar = computed(
    () => this.sinRestriccionSalidas() || this.salidasActividad().includes('rechazar'),
  );
  readonly puedeObservar = computed(
    () => this.sinRestriccionSalidas() || this.salidasActividad().includes('observar'),
  );
  readonly textoAvanzar = computed(() => {
    if (this.mostrarDecision()) return 'Continuar ';
    return this.salidasActividad().includes('aprobar') ? 'Aprobar' : 'Completar / Avanzar';
  });

  constructor() {
    this.cargarExpediente();
    this.cargarDocumentos();
    this.cargarEstado();
  }

  private cargarEstado(): void {
    if (!this.tramiteId) return;
    this.respuestaDecision.set('');
    this.tramiteC2Svc.getEstado(this.tramiteId).subscribe({
      next: (e) => this.tramiteEstado.set(e),
      error: () => {},
    });
  }

  esSeccionEditable(estado: string | undefined): boolean {
    return ['En ejecucion', 'Pendiente de recepcion', 'Observado', 'en_curso'].includes(estado ?? '');
  }

  esSeccionDelNodoActual(seccion: any): boolean {
    const actual = this.nodoActualId();
    if (!actual) return true;
    return seccion?.infoSeccion?.nodoId === actual;
  }

  /** True si la sección está asignada al funcionario logueado (o no tiene asignado).
   *  Refleja la regla del backend: solo el funcionario asignado puede editar/dictar
   *  su sección (clave en flujos en paralelo, donde cada rama tiene su responsable). */
  esMiSeccion(seccion: any): boolean {
    const fid = seccion?.infoSeccion?.funcionarioId;
    if (!fid) return true; // sin asignar: no bloqueamos en el front (decide el backend)
    return fid === this.authSvc.getUserId();
  }

  esSeccionCompletada(estado: string | undefined): boolean {
    return ['Derivada', 'completada', 'completado'].includes(estado ?? '');
  }

  setArchivoResolucion(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.archivoResolucion.set(input.files?.[0] ?? null);
  }

  descargarResolucion(): void {
    this.tramiteC2Svc.descargarResolucion(this.tramiteId).subscribe({
      next: (r) => {
        if (r?.url) window.open(r.url, '_blank', 'noopener');
      },
      error: () => {
        this.error.set('No se pudo obtener la resolución del trámite.');
        setTimeout(() => this.error.set(''), 4000);
      },
    });
  }

  setCampoValor(campoId: string, ev: Event): void {
    const target = ev.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    this.valoresEnEdicion.update((curr) => ({ ...curr, [campoId]: target.value }));
  }

  setCampoCheck(campoId: string, ev: Event): void {
    const target = ev.target as HTMLInputElement;
    this.valoresEnEdicion.update((curr) => ({ ...curr, [campoId]: target.checked ? 'true' : 'false' }));
  }

  setCampoRadio(campoId: string, opcion: string): void {
    this.valoresEnEdicion.update((curr) => ({ ...curr, [campoId]: opcion }));
  }

  // ── Selección múltiple (valor = JSON array de strings) ──────────────────
  private parseLista(v: string): string[] {
    if (!v) return [];
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? a.map(String) : [];
    } catch {
      return v.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  multiSeleccionado(campo: any, opcion: string): boolean {
    return this.parseLista(this.valorActual(campo)).includes(opcion);
  }

  toggleMulti(campo: any, opcion: string): void {
    const actual = this.parseLista(this.valorActual(campo));
    const i = actual.indexOf(opcion);
    if (i >= 0) actual.splice(i, 1);
    else actual.push(opcion);
    this.valoresEnEdicion.update((curr) => ({ ...curr, [campo.id]: JSON.stringify(actual) }));
  }

  // ── Matriz/tabla (valor = JSON array de filas; fila = array de celdas) ───
  matrizFilas(campo: any): string[][] {
    const v = this.valorActual(campo);
    if (!v) return [];
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? a.map((f: any) => (Array.isArray(f) ? f.map(String) : [])) : [];
    } catch {
      return [];
    }
  }

  private setMatriz(campo: any, filas: string[][]): void {
    this.valoresEnEdicion.update((curr) => ({ ...curr, [campo.id]: JSON.stringify(filas) }));
  }

  matrizAgregarFila(campo: any): void {
    const cols = (campo.opciones?.length || 1) as number;
    const filas = this.matrizFilas(campo);
    filas.push(new Array(cols).fill(''));
    this.setMatriz(campo, filas);
  }

  matrizQuitarFila(campo: any, fi: number): void {
    const filas = this.matrizFilas(campo);
    filas.splice(fi, 1);
    this.setMatriz(campo, filas);
  }

  matrizSetCelda(campo: any, fi: number, ci: number, ev: Event): void {
    const filas = this.matrizFilas(campo);
    while (filas.length <= fi) filas.push([]);
    const fila = filas[fi];
    while (fila.length <= ci) fila.push('');
    fila[ci] = (ev.target as HTMLInputElement).value;
    this.setMatriz(campo, filas);
  }

  valorActual(campo: any): string {
    const editado = this.valoresEnEdicion()[campo.id];
    return editado !== undefined ? editado : (campo.valor ?? '');
  }

  valorCalculado(seccion: any, campo: any, visitados?: Set<string>): string {
    const formula = campo?.formula;
    if (!formula) return '';
    const vistos = visitados ?? new Set<string>();
    if (vistos.has(campo.id)) return '';
    vistos.add(campo.id);

    const valores = new Map<string, number>();
    for (const c of seccion?.campos ?? []) {
      if (!c?.nombre || c.id === campo.id) continue;
      const crudo = c.tipo === 'calculado'
        ? this.valorCalculado(seccion, c, vistos)
        : this.valorActual(c);
      const n = parseFloat(crudo);
      if (!isNaN(n)) valores.set(String(c.nombre), n);
    }
    const r = this.evaluarExpresion(formula, valores);
    if (r === null || !isFinite(r)) return '';
    return String(Math.round(r * 100) / 100);
  }

  private evaluarExpresion(expr: string, vars: Map<string, number>): number | null {
    const tokens = expr.match(/\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|[()+\-*/]/g);
    if (!tokens || tokens.join('') !== expr.replace(/\s+/g, '')) return null;
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    const factor = (): number | null => {
      const t = peek();
      if (t === undefined) return null;
      if (t === '-') { next(); const f = factor(); return f === null ? null : -f; }
      if (t === '(') {
        next();
        const e = suma();
        if (peek() !== ')') return null;
        next();
        return e;
      }
      if (/^\d/.test(t)) { next(); return parseFloat(t); }
      if (/^[A-Za-z_]/.test(t)) {
        next();
        return vars.has(t) ? (vars.get(t) as number) : null;
      }
      return null;
    };
    const producto = (): number | null => {
      let v = factor();
      if (v === null) return null;
      while (peek() === '*' || peek() === '/') {
        const op = next();
        const f = factor();
        if (f === null) return null;
        v = op === '*' ? v * f : v / f;
      }
      return v;
    };
    const suma = (): number | null => {
      let v = producto();
      if (v === null) return null;
      while (peek() === '+' || peek() === '-') {
        const op = next();
        const p = producto();
        if (p === null) return null;
        v = op === '+' ? v + p : v - p;
      }
      return v;
    };

    const resultado = suma();
    return pos === tokens.length ? resultado : null;
  }

  readonly subiendoCampoId = signal<string | null>(null);

  docDeCampo(campo: any): DocumentoArchivo | null {
    const id = this.valorActual(campo);
    if (!id) return null;
    return this.documentos().find((d) => d.id === id) ?? null;
  }

  subirCampoArchivo(seccion: any, campo: any, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    const actividadId = this.actividadActualId() ?? '';
    const nodoId = this.nodoActualId() ?? seccion?.infoSeccion?.nodoId ?? undefined;
    if (!actividadId && !nodoId) {
      this.error.set('No se pudo determinar la actividad actual del trámite.');
      setTimeout(() => this.error.set(''), 4000);
      return;
    }
    const nombreLogico = `${campo.etiqueta || campo.nombre} — ${archivo.name}`;
    if (
      this.documentos().some(
        (d: any) => (d.nombreLogico ?? '').trim().toLowerCase() === nombreLogico.toLowerCase(),
      ) &&
      !confirm(`Ya existe un documento "${nombreLogico}" en el trámite. ¿Subirlo igual?`)
    ) {
      input.value = '';
      return;
    }
    this.subiendoCampoId.set(campo.id);
    this.docSvc
      .subir(this.tramiteId, archivo, {
        tramiteId: this.tramiteId,
        actividadId,
        nodoId,
        tipoDocumento: this.tipoDesdeArchivo(archivo),
        nombreLogico,
        obligatorio: !!campo.obligatorio,
      })
      .subscribe({
        next: (resp) => {
          this.subiendoCampoId.set(null);
          this.valoresEnEdicion.update((curr) => ({
            ...curr,
            [campo.id]: resp.documentoArchivoId,
          }));
          this.cargarDocumentos();
          input.value = '';
        },
        error: (err: any) => {
          this.subiendoCampoId.set(null);
          this.error.set(this.mensajeErrorSubida(err));
          setTimeout(() => this.error.set(''), 6000);
          input.value = '';
        },
      });
  }

  reemplazarCampoArchivo(campo: any, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    const documentoId = this.valorActual(campo);
    if (!archivo || !documentoId) return;
    this.subiendoCampoId.set(campo.id);
    this.docSvc
      .nuevaVersion(documentoId, archivo, `Reemplazo desde el campo "${campo.etiqueta || campo.nombre}"`)
      .subscribe({
        next: () => {
          this.subiendoCampoId.set(null);
          this.cargarDocumentos();
          input.value = '';
        },
        error: (err: any) => {
          this.subiendoCampoId.set(null);
          this.error.set(this.mensajeErrorSubida(err));
          setTimeout(() => this.error.set(''), 6000);
          input.value = '';
        },
      });
  }

  verArchivoCampo(campo: any): void {
    const id = this.valorActual(campo);
    if (!id) return;
    this.docSvc.preview(id).subscribe({
      next: (p) => {
        if (p?.urlPreview) window.open(p.urlPreview, '_blank', 'noopener');
      },
      error: () => {
        this.error.set('No se pudo abrir el adjunto.');
        setTimeout(() => this.error.set(''), 4000);
      },
    });
  }

  private tipoDesdeArchivo(archivo: File): TipoDocumento {
    const ext = (archivo.name.split('.').pop() ?? '').toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(ext)) return 'WORD';
    if (['xls', 'xlsx'].includes(ext)) return 'EXCEL';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'IMAGEN';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'AUDIO';
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'VIDEO';
    return 'OTRO';
  }

  guardarBorradorSeccion(seccion: any): void {
    const seccionId = seccion?.infoSeccion?.id;
    if (!seccionId) return;

    const editados = this.valoresEnEdicion();
    const campos = (seccion.campos ?? [])
      .map((c: any) => ({
        campoId: c.id,
        valor: c.tipo === 'calculado'
          ? this.valorCalculado(seccion, c)
          : (editados[c.id] !== undefined ? editados[c.id] : (c.valor ?? '')),
      }))
      .filter((c: any) => c.campoId);

    this.guardandoSeccionId.set(seccionId);
    this.guardadoOkSeccionId.set(null);
    this.tramiteC2Svc.guardarBorradorSeccion(seccionId, campos).subscribe({
      next: () => {
        this.guardandoSeccionId.set(null);
        this.guardadoOkSeccionId.set(seccionId);
        this.cargarExpediente();
        this.cargarEstado();
        setTimeout(() => this.guardadoOkSeccionId.set(null), 3000);
      },
      error: (err: any) => {
        this.guardandoSeccionId.set(null);
        this.error.set(mensajeAmigable(err, 'No se pudo guardar el borrador'));
      },
    });
  }

  private cargarDocumentos(): void {
    if (!this.tramiteId) return;
    this.cargandoDocumentos.set(true);
    this.errorDocumentos.set('');
    this.docSvc.listarPorTramite(this.tramiteId).subscribe({
      next: (docs) => {
        this.documentos.set(docs);
        this.cargandoDocumentos.set(false);
      },
      error: (err: any) => {
        this.cargandoDocumentos.set(false);
        if (err?.status === 403) {
          this.errorDocumentos.set('Sin permiso de lectura para los documentos de este trámite.');
        } else if (err?.status !== 404) {
          this.errorDocumentos.set('No se pudieron cargar los documentos.');
        }
      },
    });
  }

  verDocumento(doc: DocumentoArchivo): void {
    if (this.previewCargandoId() === doc.id) return;
    this.previewCargandoId.set(doc.id);
    this.docSvc.preview(doc.id).subscribe({
      next: (p) => {
        this.previewCargandoId.set(null);
        if (p?.urlPreview) {
          window.open(p.urlPreview, '_blank', 'noopener');
        }
      },
      error: () => {
        this.previewCargandoId.set(null);
        this.errorDocumentos.set('No se pudo generar la vista previa.');
        setTimeout(() => this.errorDocumentos.set(''), 4000);
      },
    });
  }

  setArchivoSubir(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.archivoSubir.set(input.files?.[0] ?? null);
  }

  setTipoDocumentoSubir(ev: Event): void {
    this.tipoDocumentoSubir.set((ev.target as HTMLSelectElement).value as TipoDocumento);
  }

  setNombreLogicoSubir(ev: Event): void {
    this.nombreLogicoSubir.set((ev.target as HTMLInputElement).value);
  }

  setObligatorioSubir(ev: Event): void {
    this.obligatorioSubir.set((ev.target as HTMLInputElement).checked);
  }

  esOfficeEditable(d: { nombreLogico?: string; tipoDocumento?: string }): boolean {
    const n = (d?.nombreLogico ?? '').toLowerCase();
    if (/\.(docx|xlsx|pptx|doc|xls|ppt|odt|ods|odp)$/.test(n)) return true;
    const t = (d?.tipoDocumento ?? '').toUpperCase();
    return t === 'WORD' || t === 'EXCEL';
  }

  abrirOffice(d: { id: string }): void {
    window.open(`/funcionario/documentos/${d.id}/office`, '_blank');
  }

  abrirOfficeView(d: { id: string }): void {
    window.open(`/funcionario/documentos/${d.id}/office?mode=view`, '_blank');
  }

  setNombreNuevoDoc(ev: Event): void {
    this.nombreNuevoDoc.set((ev.target as HTMLInputElement).value);
  }

  crearDocumento(): void {
    const nombre = this.nombreNuevoDoc().trim();
    if (!nombre) {
      this.errorDocumentos.set('Ponle un nombre al documento.');
      setTimeout(() => this.errorDocumentos.set(''), 4000);
      return;
    }
    // Resolver actividad/nodo: nodo actual  1ª sección editable  documento ya
    // existente del trámite (la lista trae actividadId/nodoId). El último respaldo
    // cubre trámites en paralelo o sin nodoActual único, donde /estado no lo expone.
    const docPrev = this.documentos()[0];
    const nodoId = this.nodoActualId() ?? this.nodoIdSeccionEditable() ?? docPrev?.nodoId ?? undefined;
    const actividadId = this.actividadActualId() ?? docPrev?.actividadId ?? undefined;
    if (!actividadId && !nodoId) {
      this.errorDocumentos.set('No se pudo determinar la actividad del trámite para crear el documento.');
      setTimeout(() => this.errorDocumentos.set(''), 4000);
      return;
    }
    this.creandoDoc.set(true);
    this.errorDocumentos.set('');
    this.docSvc
      .crearEnBlanco(this.tramiteId, {
        tipo: this.tipoNuevoDoc(),
        nombreLogico: nombre,
        nodoId,
        actividadId,
      })
      .subscribe({
        next: (resp) => {
          this.creandoDoc.set(false);
          this.mostrarCrearDoc.set(false);
          this.nombreNuevoDoc.set('');
          this.cargarDocumentos();
          window.open(`/funcionario/documentos/${resp.documentoArchivoId}/office`, '_blank');
        },
        error: () => {
          this.creandoDoc.set(false);
          this.errorDocumentos.set('No se pudo crear el documento.');
          setTimeout(() => this.errorDocumentos.set(''), 5000);
        },
      });
  }

  subirDocumento(): void {
    const archivo = this.archivoSubir();
    if (!archivo) {
      this.errorDocumentos.set('Selecciona un archivo para subir.');
      setTimeout(() => this.errorDocumentos.set(''), 4000);
      return;
    }
    const nombreLogico = this.nombreLogicoSubir().trim() || archivo.name;
    // Respaldo: si no hay nodoActual ni sección editable resoluble, usa el
    // actividadId/nodoId de un documento ya existente del trámite.
    const docPrev = this.documentos()[0];
    const actividadId = this.actividadActualId() ?? docPrev?.actividadId ?? undefined;
    const nodoId = this.nodoActualId() ?? this.nodoIdSeccionEditable() ?? docPrev?.nodoId ?? undefined;
    if (!actividadId && !nodoId) {
      this.errorDocumentos.set('No se pudo determinar el nodo actual del trámite.');
      setTimeout(() => this.errorDocumentos.set(''), 4000);
      return;
    }

    const existente = this.documentos().find(
      (d: any) => (d.nombreLogico ?? '').trim().toLowerCase() === nombreLogico.toLowerCase(),
    );
    if (existente) {
      if (
        !confirm(
          `Ya existe un documento "${nombreLogico}" en el trámite. ¿Reemplazarlo (se guarda como nueva versión)?`,
        )
      ) {
        return;
      }
      this.subiendoDocumento.set(true);
      this.errorDocumentos.set('');
      this.docSvc.nuevaVersion(existente.id, archivo, 'Reemplazo desde el expediente').subscribe({
        next: () => {
          this.subiendoDocumento.set(false);
          this.archivoSubir.set(null);
          this.nombreLogicoSubir.set('');
          this.obligatorioSubir.set(false);
          this.tipoDocumentoSubir.set('PDF');
          this.exito.set('Documento reemplazado (nueva versión).');
          setTimeout(() => this.exito.set(''), 4000);
          this.cargarDocumentos();
        },
        error: () => {
          this.subiendoDocumento.set(false);
          this.errorDocumentos.set('No se pudo reemplazar el documento.');
          setTimeout(() => this.errorDocumentos.set(''), 5000);
        },
      });
      return;
    }

    const req: SubirDocumentoRequest = {
      tramiteId: this.tramiteId,
      actividadId: actividadId ?? '',
      nodoId,
      tipoDocumento: this.tipoDocumentoSubir(),
      nombreLogico,
      obligatorio: this.obligatorioSubir(),
    };

    this.subiendoDocumento.set(true);
    this.errorDocumentos.set('');
    this.docSvc.subir(this.tramiteId, archivo, req).subscribe({
      next: () => {
        this.subiendoDocumento.set(false);
        this.archivoSubir.set(null);
        this.nombreLogicoSubir.set('');
        this.obligatorioSubir.set(false);
        this.tipoDocumentoSubir.set('PDF');
        this.exito.set('Documento subido al trámite.');
        setTimeout(() => this.exito.set(''), 4000);
        this.cargarDocumentos();
      },
      error: (err: any) => {
        this.subiendoDocumento.set(false);
        this.errorDocumentos.set(this.mensajeErrorSubida(err));
        setTimeout(() => this.errorDocumentos.set(''), 6000);
      },
    });
  }

  private mensajeErrorSubida(err: any): string {
    switch (err?.status) {
      case 409:
        return 'Documento duplicado (hash)';
      case 403:
        return 'Sin permiso de escritura en esta actividad';
      case 413:
        return 'Archivo > limite';
      case 503:
        return 'Almacenamiento no disponible';
      default:
        return mensajeAmigable(err, 'No se pudo subir el documento.');
    }
  }

  iconoTipoDoc(tipo: string): string {
    switch ((tipo || '').toUpperCase()) {
      case 'PDF':    return '';
      case 'IMAGEN': return '';
      case 'WORD':   return '';
      case 'EXCEL':  return '';
      case 'AUDIO':  return '';
      case 'VIDEO':  return '';
      default:       return '';
    }
  }

  cargarExpediente(): void {
    if (!this.tramiteId) return;
    this.loading.set(true);
    this.error.set('');

    this.tramiteC2Svc.getExpediente(this.tramiteId).subscribe({
      next: (data) => {
        this.expediente.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(mensajeAmigable(err, 'Error al cargar el expediente.'));
        this.loading.set(false);
      },
    });
  }

  prepararDevolucion(): void {
    this.accionSeleccionada.set('DEVOLVER');
    this.nodoDestinoId.set('');
    this.documentosObservadosIds.set(new Set());

    if (this.seccionesAnteriores().length === 0) {
      const exp = this.expediente();
      const completadas = (exp?.secciones ?? []).filter((s: any) =>
        this.esSeccionCompletada(s.infoSeccion?.estado),
      );
      this.seccionesAnteriores.set(completadas);
    }

    if (this.documentos().length === 0 && !this.cargandoDocumentos()) {
      this.cargarDocumentos();
    }
  }

  toggleDocumentoObservado(docId: string): void {
    this.documentosObservadosIds.update((curr) => {
      const next = new Set(curr);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }

  aceptar(): void {
    this.procesando.set(true);
    this.error.set('');
    this.tramiteC2Svc.aceptarTramite(this.tramiteId).subscribe({
      next: () => {
        this.procesando.set(false);
        this.exito.set('Trámite aceptado. Ahora está en ejecución a tu cargo.');
        this.cargarExpediente();
        this.cargarEstado();
        setTimeout(() => this.exito.set(''), 4000);
      },
      error: (err) => this.manejarError(err),
    });
  }

  prepararDerivacion(): void {
    this.accionSeleccionada.set('DERIVAR');
    this.funcionarioDestinoId.set('');

    if (this.listaFuncionarios().length === 0) {
      this.tramiteC2Svc.getUsuarios().subscribe({
        next: (data) => {
          this.listaFuncionarios.set(data);
        },
        error: () => this.error.set('No se pudo cargar la lista de funcionarios.'),
      });
    }
  }

  private mensajeConfirmacion(tipo: string): string {
    if (tipo === 'APROBAR') {
      if (this.mostrarDecision()) return '¿Continuar el trámite con la respuesta seleccionada?';
      return this.salidasActividad().includes('aprobar')
        ? '¿Aprobar y cerrar el trámite?'
        : '¿Completar esta actividad y avanzar al siguiente paso?';
    }
    if (tipo === 'RECHAZAR') return '¿Rechazar el trámite definitivamente? Esto lo cierra.';
    if (tipo === 'DEVOLVER') return '¿Devolver el trámite para corrección?';
    if (tipo === 'REASIGNAR' || tipo === 'DERIVAR') return '¿Reasignar el trámite a otro funcionario?';
    return `¿Proceder con: ${tipo}?`;
  }

  ejecutarAccion(tipo: string): void {
    if (tipo === 'DEVOLVER' && this.documentosObservadosIds().size === 0) {
      this.error.set('Selecciona al menos un documento a corregir para devolver el trámite.');
      return;
    }

    if (!confirm(this.mensajeConfirmacion(tipo))) return;

    this.procesando.set(true);
    this.error.set('');

    if (tipo === 'APROBAR') {
      if (this.mostrarDecision()) {
        const rama = this.respuestaDecision();
        if (!rama) {
          this.procesando.set(false);
          this.error.set('Responde la pregunta para indicar por dónde continúa el trámite.');
          return;
        }
        this.tramiteC2Svc
          .completarNodo(this.tramiteId, rama, this.justificacion(), this.nodoActualId() ?? undefined)
          .subscribe({
            next: () =>
              this.finalizarExitosamente('Actividad completada. El trámite continuó por la respuesta seleccionada.'),
            error: (err) => this.manejarError(err),
          });
        return;
      }
      if (!this.salidasActividad().includes('aprobar')) {
        this.tramiteC2Svc
          .completarNodo(this.tramiteId, undefined, this.justificacion(), this.nodoActualId() ?? undefined)
          .subscribe({
            next: () => this.finalizarExitosamente('Actividad completada. El trámite avanzó al siguiente paso.'),
            error: (err) => this.manejarError(err),
          });
        return;
      }
      const archivo = this.archivoResolucion();
      const obs$ = archivo
        ? this.tramiteC2Svc.decisionFinalConResolucion(this.tramiteId, 'Aprobar', this.justificacion(), archivo)
        : this.tramiteC2Svc.decisionFinal(this.tramiteId, 'Aprobar', this.justificacion());
      obs$.subscribe({
        next: () => this.finalizarExitosamente('Trámite aprobado.'),
        error: (err) => this.manejarError(err),
      });
    } else if (tipo === 'RECHAZAR') {
      this.tramiteC2Svc.decisionFinal(this.tramiteId, 'Rechazar', this.justificacion()).subscribe({
        next: () => this.finalizarExitosamente('Trámite rechazado y cerrado.'),
        error: (err) => this.manejarError(err),
      });
    } else if (tipo === 'DEVOLVER') {
      this.tramiteC2Svc
        .devolverTramite(
          this.tramiteId,
          this.nodoDestinoId(),
          this.justificacion(),
          Array.from(this.documentosObservadosIds()),
        )
        .subscribe({
          next: () => this.finalizarExitosamente('Trámite devuelto para corrección.'),
          error: (err) => this.manejarError(err),
        });
    } else if (tipo === 'DERIVAR' || tipo === 'REASIGNAR') {
      this.tramiteC2Svc
        .reasignarTramite(this.tramiteId, this.funcionarioDestinoId(), this.justificacion())
        .subscribe({
          next: () => this.finalizarExitosamente('Trámite reasignado al compañero.'),
          error: (err) => this.manejarError(err),
        });
    }
  }

  setJustificacion(ev: Event): void {
    this.justificacion.set((ev.target as HTMLTextAreaElement).value);
  }

  setRespuestaDecision(valor: string): void {
    this.respuestaDecision.set(valor);
  }

  setNodoDestino(ev: Event): void {
    this.nodoDestinoId.set((ev.target as HTMLSelectElement).value);
  }

  setFuncionarioDestino(ev: Event): void {
    this.funcionarioDestinoId.set((ev.target as HTMLSelectElement).value);
  }

  private finalizarExitosamente(mensaje: string): void {
    this.procesando.set(false);
    alert(mensaje);
    this.router.navigate([this.volverUrl()]);
  }

  private manejarError(err: any): void {
    this.procesando.set(false);
    this.error.set(`Error al procesar la acción: ${mensajeAmigable(err)}`);
  }

  formatearFecha(iso: string | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('es-BO');
    } catch {
      return iso;
    }
  }

  onDictadoAplicado(seccion: any, resp: DictarFormularioResponse): void {
    const campos: any[] = seccion?.campos ?? [];
    const porNombre = new Map<string, any>(
      campos.filter((c) => c?.nombre).map((c) => [String(c.nombre), c]),
    );

    const patch: Record<string, string> = {};
    const noCasados: string[] = [];
    let aplicados = 0;

    for (const sug of resp.campos ?? []) {
      const crudo = (sug.valor ?? '').trim();
      if (!crudo) continue;
      const campo = porNombre.get(sug.campo);
      if (!campo?.id) {
        noCasados.push(sug.campo);
        continue;
      }
      const valor = this.normalizarValorDictado(crudo, campo);
      if (valor === null) {
        noCasados.push(sug.campo);
        continue;
      }
      patch[campo.id] = valor;
      campo.valor = valor;
      campo.fueDictado = true;
      aplicados++;
    }

    if (aplicados > 0) {
      this.valoresEnEdicion.update((curr) => ({ ...curr, ...patch }));
      this.expediente.update((e) => (e ? { ...e } : e));
    }

    const extra = noCasados.length
      ? ` (${noCasados.length} sin ubicar: ${noCasados.join(', ')})`
      : '';
    this.exito.set(
      aplicados > 0
        ? `${aplicados} campo(s) rellenado(s) por dictado. Revísalos y pulsa "Guardar borrador".${extra}`
        : `El dictado no mapeó ningún campo de esta sección.${extra}`,
    );
    setTimeout(() => this.exito.set(''), 6000);
  }

  private normalizarValorDictado(valor: string, campo: any): string | null {
    switch (campo?.tipo) {
      case 'checkbox':
        return /^(true|s[ií]|1|ok|x)$/i.test(valor) ? 'true' : 'false';
      case 'select':
      case 'radio': {
        const opciones: string[] = campo.opciones ?? [];
        const match = opciones.find((o) => o.toLowerCase() === valor.toLowerCase());
        return match ?? null;
      }
      case 'fecha':
        return this.aIsoFecha(valor);
      default:
        return valor;
    }
  }

  private aIsoFecha(valor: string): string | null {
    const v = valor.trim().toLowerCase();
    const hoy = new Date();
    if (v === 'hoy') return this.fechaIso(hoy);
    if (v === 'mañana' || v === 'manana') {
      const m = new Date(hoy);
      m.setDate(m.getDate() + 1);
      return this.fechaIso(m);
    }
    const m = valor.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
    if (!m) return null;
    const dia = +m[1];
    const mes = +m[2];
    let anio = m[3] ? +m[3] : hoy.getFullYear();
    if (anio < 100) anio += 2000;
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    return `${anio.toString().padStart(4, '0')}-${mes
      .toString()
      .padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
  }

  private fechaIso(d: Date): string {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
      .getDate()
      .toString()
      .padStart(2, '0')}`;
  }
}
