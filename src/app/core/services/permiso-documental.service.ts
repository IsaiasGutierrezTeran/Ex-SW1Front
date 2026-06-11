import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PermisoPuntoAtencion,
  PermisoPuntoAtencionRequest,
} from '../models/permiso-punto-atencion.model';

@Injectable({ providedIn: 'root' })
export class PermisoDocumentalService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  upsert(req: PermisoPuntoAtencionRequest): Observable<PermisoPuntoAtencion> {
    return this.http.put<PermisoPuntoAtencion>(
      `${this.api}/actividades/${req.actividadId}/permiso-documental`,
      req,
    );
  }

  listarPorPolitica(politicaId: string): Observable<PermisoPuntoAtencion[]> {
    return this.http.get<PermisoPuntoAtencion[]>(
      `${this.api}/politicas/${politicaId}/permisos-documentales`,
    );
  }

  obtener(politicaId: string, actividadId: string): Observable<PermisoPuntoAtencion> {
    return this.http.get<PermisoPuntoAtencion>(
      `${this.api}/politicas/${politicaId}/actividades/${actividadId}/permiso-documental`,
    );
  }
}
