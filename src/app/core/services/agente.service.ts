import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FaqOfflineService } from './faq-offline.service';

export interface AgenteAccion {
  label?: string;
  ruta?: string;
  tipo?: string;
  dato?: string;
}

export interface AgenteRespuesta {
  idLogBaseDatos?: string;
  respuesta: string;
  accion?: AgenteAccion | null;
  fuente?: string;
}

export interface AgenteConsulta {
  consulta: string;
  moduloActivo: string;
  tramiteIdOpcional?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AgenteService {
  private readonly http = inject(HttpClient);
  private readonly faqOffline = inject(FaqOfflineService);
  private readonly url = `${environment.apiUrl}/agente/consultar`;

  consultar(payload: AgenteConsulta): Observable<AgenteRespuesta>;
  consultar(
    consulta: string,
    modulo: string,
    tramiteIdOpcional?: string | null,
  ): Observable<AgenteRespuesta>;
  consultar(
    consultaOrPayload: string | AgenteConsulta,
    modulo?: string,
    tramiteIdOpcional?: string | null,
  ): Observable<AgenteRespuesta> {
    const payload: AgenteConsulta =
      typeof consultaOrPayload === 'string'
        ? {
            consulta: consultaOrPayload,
            moduloActivo: modulo ?? '',
            tramiteIdOpcional: tramiteIdOpcional ?? null,
          }
        : consultaOrPayload;

    // Si no hay conexión / el backend falla, responde la IA offline (FAQ local).
    return this.http.post<AgenteRespuesta>(this.url, payload).pipe(
      catchError(() =>
        of<AgenteRespuesta>({
          respuesta: this.faqOffline.responder(payload.consulta),
          fuente: 'offline',
          accion: null,
        }),
      ),
    );
  }
}
