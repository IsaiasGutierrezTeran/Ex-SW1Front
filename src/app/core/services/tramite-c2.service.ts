import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TramiteC2Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  getMisPendientes(ordenarPor?: 'fecha' | 'ia'): Observable<any[]> {
    const q = ordenarPor ? `?ordenarPor=${ordenarPor}` : '';
    return this.http.get<any[]>(`${this.base}/tramites/mis-pendientes${q}`);
  }

  getExpediente(tramiteId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/expedientes/tramite/${tramiteId}`);
  }

  getEstado(tramiteId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/tramites/${tramiteId}/estado`);
  }

  completarNodo(tramiteId: string, decision?: string, notas?: string, nodoId?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/tramites/${tramiteId}/completar-nodo`, {
      decision,
      notas,
      nodoId,
    });
  }

  aceptarTramite(tramiteId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/tramites/${tramiteId}/aceptar`, {});
  }

  decisionFinal(tramiteId: string, decision: string, justificacion: string): Observable<any> {
    return this.http.post<any>(`${this.base}/tramites/${tramiteId}/decision-final`, {
      decision,
      justificacion,
    });
  }

  decisionFinalConResolucion(
    tramiteId: string,
    decision: string,
    justificacion: string,
    archivo: File,
  ): Observable<any> {
    const formData = new FormData();
    formData.append('decision', decision);
    formData.append('justificacion', justificacion ?? '');
    formData.append('archivo', archivo, archivo.name);
    return this.http.post<any>(`${this.base}/tramites/${tramiteId}/decision-final`, formData);
  }

  descargarResolucion(tramiteId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/tramites/${tramiteId}/resolucion`);
  }

  devolverTramite(
    tramiteId: string,
    nodoDestinoId: string,
    observaciones: string,
    documentosObservados: string[] = [],
  ): Observable<any> {
    return this.http.post<any>(`${this.base}/tramites/${tramiteId}/devolver`, {
      nodoDestinoId,
      observaciones,
      documentosObservados,
    });
  }

  reasignarTramite(tramiteId: string, nuevoFuncionarioId: string, motivo: string): Observable<any> {
    return this.http.post<any>(`${this.base}/tramites/${tramiteId}/reasignar`, {
      nuevoFuncionarioId,
      motivo,
    });
  }

  derivarTramite(tramiteId: string, nuevoFuncionarioId: string, motivo: string): Observable<any> {
    return this.reasignarTramite(tramiteId, nuevoFuncionarioId, motivo);
  }

  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/usuarios/funcionarios`);
  }

  transcribirVoz(seccionId: string, audioBlob: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'grabacion.webm');
    return this.http.post<any>(
      `${this.base}/expedientes/secciones/${seccionId}/transcribir-voz`,
      formData,
    );
  }

  guardarBorradorSeccion(
    seccionId: string,
    campos: Array<{ campoId: string; valor: string }>,
  ): Observable<any> {
    return this.http.put<any>(`${this.base}/seccion/${seccionId}`, { campos });
  }
}
