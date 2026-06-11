import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notificacion {
  id: string;
  tramiteId?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = environment.apiUrl;

  readonly lista = signal<Notificacion[]>([]);
  readonly noLeidas = computed(() => this.lista().filter((n) => !n.leida).length);

  private timer: ReturnType<typeof setInterval> | null = null;

  iniciarPolling(): void {
    if (!isPlatformBrowser(this.platformId) || this.timer) return;
    this.refrescar();
    this.timer = setInterval(() => this.refrescar(), 30_000);
  }

  detenerPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  refrescar(): void {
    this.http
      .get<Notificacion[]>(`${this.api}/notificaciones/mis-notificaciones`)
      .subscribe({
        next: (l) => this.lista.set(l ?? []),
        error: () => {},
      });
  }

  marcarLeida(id: string): Observable<Notificacion> {
    return this.http.put<Notificacion>(`${this.api}/notificaciones/${id}/marcar-leida`, {});
  }
}
