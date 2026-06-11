import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DocumentoArchivo,
  DocumentoArchivoResponse,
  PreviewDocumento,
  SubirDocumentoRequest,
} from '../models/documento-archivo.model';
import { VersionDocumento } from '../models/version-documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoArchivoService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  subir(
    tramiteId: string,
    archivo: File,
    req: SubirDocumentoRequest,
  ): Observable<DocumentoArchivoResponse> {
    const fd = new FormData();
    fd.append('archivo', archivo);
    if (req.actividadId) fd.append('actividadId', req.actividadId);
    if (req.nodoId) fd.append('nodoId', req.nodoId);
    fd.append('tipoDocumento', req.tipoDocumento);
    fd.append('nombreLogico', req.nombreLogico);
    fd.append('obligatorio', String(req.obligatorio ?? false));

    return this.http.post<DocumentoArchivoResponse>(
      `${this.api}/tramites/${tramiteId}/documentos`,
      fd,
    );
  }

  listarPorTramite(tramiteId: string, actividadId?: string): Observable<DocumentoArchivo[]> {
    const url = actividadId
      ? `${this.api}/tramites/${tramiteId}/documentos?actividadId=${actividadId}`
      : `${this.api}/tramites/${tramiteId}/documentos`;
    return this.http.get<DocumentoArchivo[]>(url);
  }

  preview(documentoId: string): Observable<PreviewDocumento> {
    return this.http.get<PreviewDocumento>(`${this.api}/documentos/${documentoId}/preview`);
  }

  listarVersiones(documentoId: string): Observable<VersionDocumento[]> {
    return this.http.get<VersionDocumento[]>(`${this.api}/documentos/${documentoId}/versiones`);
  }

  onlyofficeConfig(
    documentoId: string,
    mode: 'edit' | 'view' = 'edit',
  ): Observable<{ serverUrl: string; config: unknown }> {
    return this.http.get<{ serverUrl: string; config: unknown }>(
      `${this.api}/documentos/${documentoId}/onlyoffice/config?mode=${mode}`,
    );
  }

  crearEnBlanco(
    tramiteId: string,
    body: { tipo: 'docx' | 'xlsx'; nombreLogico: string; nodoId?: string; actividadId?: string },
  ): Observable<DocumentoArchivoResponse> {
    return this.http.post<DocumentoArchivoResponse>(
      `${this.api}/tramites/${tramiteId}/documentos/blank`,
      body,
    );
  }

  /** Fuerza el guardado de la co-edición OnlyOffice (crea nueva versión en S3). */
  forzarGuardado(documentoId: string): Observable<{ status: number; respuesta: string }> {
    return this.http.post<{ status: number; respuesta: string }>(
      `${this.api}/documentos/${documentoId}/onlyoffice/forzar-guardado`,
      {},
    );
  }

  nuevaVersion(
    documentoId: string,
    archivo: File,
    comentarioCambio?: string,
  ): Observable<DocumentoArchivoResponse> {
    const fd = new FormData();
    fd.append('archivo', archivo);
    if (comentarioCambio) fd.append('comentarioCambio', comentarioCambio);
    return this.http.post<DocumentoArchivoResponse>(
      `${this.api}/documentos/${documentoId}/versiones`,
      fd,
    );
  }
}
