import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MetricasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  getMetricasTramite(tramiteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/metricas/tramite/${tramiteId}`);
  }

  getCuellosDeBotella(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/metricas/cuellos-botella`);
  }

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.base}/metricas/dashboard`);
  }
}
