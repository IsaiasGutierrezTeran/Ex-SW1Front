import { inject, Injectable } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface DocumentoEventoRT {
  tipo: 'op' | 'join' | 'leave' | 'kick' | 'cursor' | 'roster' | 'snapshot';
  documentoId: string;
  payload: unknown;
  autorId?: string | null;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ColaboracionDocumentoRtService {
  private readonly auth = inject(AuthService);
  private rx: RxStomp | null = null;
  private suscriptores = new Map<string, number>();

  observarEdicion(documentoId: string): Observable<DocumentoEventoRT> {
    return this.observar(`/topic/documento/${documentoId}/edicion`, documentoId);
  }

  observarPresencia(documentoId: string): Observable<DocumentoEventoRT> {
    return this.observar(`/topic/documento/${documentoId}/presencia`, documentoId);
  }

  publicarJoin(documentoId: string): void {
    this.publicar(documentoId, 'join', {});
  }

  publicarLeave(documentoId: string): void {
    this.publicar(documentoId, 'leave', {});
  }

  publicarOp(documentoId: string, op: unknown): void {
    this.publicar(documentoId, 'op', op);
  }

  publicarCursor(documentoId: string, cursorPos: number): void {
    this.publicar(documentoId, 'cursor', { cursorPos });
  }

  private observar(topic: string, documentoId: string): Observable<DocumentoEventoRT> {
    return new Observable<DocumentoEventoRT>((subscriber) => {
      this.asegurarConexion();
      const cuenta = this.suscriptores.get(documentoId) ?? 0;
      this.suscriptores.set(documentoId, cuenta + 1);

      const sub = this.rx!.watch(topic)
        .pipe(map((msg) => JSON.parse(msg.body) as DocumentoEventoRT))
        .subscribe({
          next: (e) => subscriber.next(e),
          error: (err) => subscriber.error(err),
        });

      return () => {
        sub.unsubscribe();
        const restante = (this.suscriptores.get(documentoId) ?? 1) - 1;
        if (restante <= 0) {
          this.suscriptores.delete(documentoId);
        } else {
          this.suscriptores.set(documentoId, restante);
        }
        if (this.suscriptores.size === 0) {
          this.desconectar();
        }
      };
    });
  }

  private publicar(documentoId: string, accion: string, body: unknown): void {
    this.asegurarConexion();
    this.rx?.publish({
      destination: `/app/documento/${documentoId}/${accion}`,
      body: JSON.stringify(body ?? {}),
    });
  }

  private asegurarConexion(): void {
    if (this.rx?.active) return;
    const wsBase = environment.apiUrl.replace(/^http/i, 'ws').replace(/\/api\/?$/, '');
    const cfg: RxStompConfig = {
      brokerURL: `${wsBase}/ws`,
      reconnectDelay: 3000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      beforeConnect: (client) => {
        const token = this.auth.getToken() ?? '';
        client.configure({ brokerURL: `${wsBase}/ws?token=${encodeURIComponent(token)}` });
      },
    };
    this.rx = new RxStomp();
    this.rx.configure(cfg);
    this.rx.activate();
  }

  private desconectar(): void {
    if (!this.rx) return;
    try {
      void this.rx.deactivate();
    } catch {}
    this.rx = null;
  }

  forzarCierre(): void {
    this.suscriptores.clear();
    this.desconectar();
  }
}
