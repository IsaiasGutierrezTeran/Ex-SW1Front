import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, UsuarioCreateRequest, UsuarioUpdateRequest } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  buscarPorId(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/${id}`);
  }

  crear(data: UsuarioCreateRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/crear`, data);
  }

  actualizar(id: string, data: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/${id}`, data);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  toggleActivo(id: string, activo: boolean): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/${id}`, { activo });
  }

  // ── Perfil propio ────────────────────────────────────────
  miPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/me`);
  }

  actualizarMiPerfil(data: {
    nombre: string;
    apellido: string;
    telefono?: string;
    dni?: string;
    direccion?: string;
  }): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/me`, data);
  }

  cambiarPassword(actual: string, nueva: string): Observable<void> {
    return this.http.put<void>(`${this.url}/me/password`, { actual, nueva });
  }

  subirFoto(file: File): Observable<Usuario> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<Usuario>(`${this.url}/me/foto`, fd);
  }

  miFoto(): Observable<Blob> {
    return this.http.get(`${this.url}/me/foto`, { responseType: 'blob' });
  }
}
