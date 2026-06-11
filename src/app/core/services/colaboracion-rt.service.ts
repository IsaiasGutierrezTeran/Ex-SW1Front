import { inject, Injectable } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface DiagramaEventoRT {
  tipo:
    | 'nodo-creado'
    | 'nodo-actualizado'
    | 'nodo-eliminado'
    | 'trans-creada'
    | 'trans-actualizada'
    | 'trans-eliminada';
  diagramaId: string;
  payload: unknown;
  autorId?: string | null;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ColaboracionRtService {
  private readonly auth = inject(AuthService);
  private rx: RxStomp | null = null;
  private suscriptoresPorDiagrama = new Map<string, number>();

  observarDiagrama(diagramaId: string): Observable<DiagramaEventoRT> {
    const topic = `/topic/diagramas/${diagramaId}`;
    return new Observable<DiagramaEventoRT>((subscriber) => {
      this.asegurarConexion();
      const cuenta = this.suscriptoresPorDiagrama.get(diagramaId) ?? 0;
      this.suscriptoresPorDiagrama.set(diagramaId, cuenta + 1);

      const sub = this.rx!.watch(topic)
        .pipe(map((msg) => JSON.parse(msg.body) as DiagramaEventoRT))
        .subscribe({
          next: (e) => subscriber.next(e),
          error: (err) => subscriber.error(err),
        });

      return () => {
        sub.unsubscribe();
        const restante = (this.suscriptoresPorDiagrama.get(diagramaId) ?? 1) - 1;
        if (restante <= 0) {
          this.suscriptoresPorDiagrama.delete(diagramaId);
        } else {
          this.suscriptoresPorDiagrama.set(diagramaId, restante);
        }
        if (this.suscriptoresPorDiagrama.size === 0) {
          this.desconectar();
        }
      };
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
    this.suscriptoresPorDiagrama.clear();
    this.desconectar();
  }
}
