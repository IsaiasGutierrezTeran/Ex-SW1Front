import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CompartidoConmigo {
  colaboracionId: string;
  diagramaId: string;
  diagramaNombre: string;
  politicaNombre: string | null;
  permisos: string;
  estado: string;
  invitadoPor: string;
  fechaInvitacion: string | null;
  fechaRespuesta: string | null;
}

@Injectable({ providedIn: 'root' })
export class ColaboracionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  compartidosConmigo(): Observable<CompartidoConmigo[]> {
    return this.http.get<CompartidoConmigo[]>(`${this.base}/colaboracion/compartidos-conmigo`);
  }

  invitarColaborador(diagramaId: string, usuarioInvitadoId: string, permisos: string): Observable<any> {
    return this.http.post<any>(`${this.base}/colaboracion/diagrama/${diagramaId}/invitar`, {
      usuarioInvitadoId,
      permisos,
    });
  }

  responderInvitacion(colaboracionId: string, decision: 'ACEPTAR' | 'RECHAZAR'): Observable<any> {
    return this.http.post<any>(`${this.base}/colaboracion/${colaboracionId}/responder`, {
      decision,
    });
  }

  getUsuariosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/usuarios`);
  }
}
