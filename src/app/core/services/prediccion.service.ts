import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RutaOptima, TramiteRiesgo } from '../models/tramite-riesgo.model';

@Injectable({ providedIn: 'root' })
export class PrediccionService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  rutaOptima(tramiteId: string): Observable<RutaOptima> {
    return this.http.post<RutaOptima>(
      `${this.api}/tramites/${tramiteId}/ruta-optima`,
      {},
    );
  }

  enRiesgo(nivel?: 'alto' | 'medio' | 'bajo'): Observable<TramiteRiesgo[]> {
    const params = nivel ? new HttpParams().set('nivel', nivel) : new HttpParams();
    return this.http.get<TramiteRiesgo[]>(`${this.api}/tramites/en-riesgo`, { params });
  }
}
