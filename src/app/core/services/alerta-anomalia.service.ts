import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertaAnomalia } from '../models/alerta-anomalia.model';

@Injectable({ providedIn: 'root' })
export class AlertaAnomaliaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/alertas-anomalias`;

  detectar(): Observable<AlertaAnomalia[]> {
    return this.http.post<AlertaAnomalia[]>(`${this.url}/detectar`, {});
  }

  listarAbiertas(): Observable<AlertaAnomalia[]> {
    return this.http.get<AlertaAnomalia[]>(this.url);
  }

  marcarFalsoPositivo(id: string): Observable<AlertaAnomalia> {
    return this.http.post<AlertaAnomalia>(`${this.url}/${id}/marcar-falso-positivo`, {});
  }
}
