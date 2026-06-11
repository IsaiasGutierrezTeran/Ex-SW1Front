import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ReporteNaturalRequest,
  ReporteNaturalResponse,
} from '../models/reporte-natural.model';

@Injectable({ providedIn: 'root' })
export class ReporteNaturalService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  generar(req: ReporteNaturalRequest): Observable<ReporteNaturalResponse> {
    return this.http.post<ReporteNaturalResponse>(
      `${this.api}/reportes/consulta-natural`,
      req,
    );
  }

  exportar(consulta: string, formato: 'xlsx' | 'pdf'): Observable<Blob> {
    return this.http.post(
      `${this.api}/reportes/consulta-natural/exportar?formato=${formato}`,
      { consulta },
      { responseType: 'blob' },
    );
  }
}
