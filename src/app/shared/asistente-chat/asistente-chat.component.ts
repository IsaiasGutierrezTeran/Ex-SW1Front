import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgenteService, AgenteAccion } from '../../core/services/agente.service';
import { AuthService } from '../../core/services/auth.service';
import { mensajeAmigable } from '../../core/utils/error-messages';

interface ChatMensaje {
  texto: string;
  delUsuario: boolean;
  accion?: AgenteAccion | null;
}

@Component({
  selector: 'app-asistente-chat',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <button
        type="button"
        class="ac-fab"
        (click)="toggle()"
        [attr.aria-label]="abierto() ? 'Cerrar asistente' : 'Abrir asistente'"
        [attr.aria-expanded]="abierto()"
      >
        @if (abierto()) {
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" />
          </svg>
        } @else {
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="8" width="16" height="11" rx="3" stroke="currentColor"
              stroke-width="2" />
            <path d="M12 4v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="12" cy="4" r="1.4" fill="currentColor" />
            <circle cx="9" cy="13" r="1.3" fill="currentColor" />
            <circle cx="15" cy="13" r="1.3" fill="currentColor" />
            <path d="M2 12v3M22 12v3" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" />
          </svg>
        }
      </button>

      @if (abierto()) {
        <section class="ac-panel" role="dialog" aria-label="Asistente">
          <header class="ac-panel__header">
            <div class="ac-panel__id">
              <span class="ac-avatar" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="8" width="16" height="11" rx="3" stroke="currentColor"
                    stroke-width="2" />
                  <path d="M12 4v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <circle cx="12" cy="4" r="1.4" fill="currentColor" />
                  <circle cx="9" cy="13" r="1.3" fill="currentColor" />
                  <circle cx="15" cy="13" r="1.3" fill="currentColor" />
                  <path d="M2 12v3M22 12v3" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" />
                </svg>
              </span>
              <span class="ac-panel__meta">
                <span class="ac-panel__title">Asistente</span>
                <span class="ac-panel__status"><i class="ac-dot"></i> En línea</span>
              </span>
            </div>
            <button
              type="button"
              class="ac-panel__close"
              (click)="cerrar()"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div #scrollBox class="ac-panel__body">
            @for (m of mensajes(); track $index) {
              <div class="ac-row" [class.ac-row--user]="m.delUsuario">
                <div
                  class="ac-bubble"
                  [class.ac-bubble--user]="m.delUsuario"
                  [class.ac-bubble--bot]="!m.delUsuario"
                >
                  {{ m.texto }}
                </div>
                @if (!m.delUsuario && m.accion?.ruta) {
                  <button
                    type="button"
                    class="ac-accion"
                    (click)="ejecutarAccion(m.accion!)"
                  >
                    {{ m.accion?.label || 'Ir' }}
                  </button>
                }
              </div>
            }
            @if (cargando()) {
              <div class="ac-row">
                <div class="ac-bubble ac-bubble--bot ac-bubble--typing" aria-label="escribiendo">
                  <span class="ac-typing"><i></i><i></i><i></i></span>
                </div>
              </div>
            }
          </div>

          <form
            class="ac-panel__input"
            (submit)="$event.preventDefault(); enviar()"
          >
            <input
              type="text"
              class="form-control"
              placeholder="Escribe tu consulta…"
              [ngModel]="consulta()"
              (ngModelChange)="consulta.set($event)"
              (keydown)="onKeydown($event)"
              name="consulta"
              autocomplete="off"
              [disabled]="cargando()"
            />
            <button
              type="submit"
              class="ac-send"
              [disabled]="cargando() || !consulta().trim()"
              aria-label="Enviar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12l16-8-6 16-3-6-7-2z" stroke="currentColor" stroke-width="2"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </form>
        </section>
      }
    }
  `,
  styles: [
    `
      :host {
        --ac-grad: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
        --ac-brand: #4f46e5;
        --ac-brand-700: #4338ca;
        --ac-surface: #ffffff;
        --ac-body-bg: #f3f6fc;
        --ac-bot-bg: #ffffff;
        --ac-bot-border: #e6ebf5;
        --ac-text: #0c1424;
        --ac-muted: #5a6b85;
      }
      :host-context([data-theme='dark']) {
        --ac-surface: #0e1426;
        --ac-body-bg: #0b1020;
        --ac-bot-bg: #141d34;
        --ac-bot-border: #243152;
        --ac-text: #e8edf9;
        --ac-muted: #9aa8c2;
      }

      .ac-fab {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        background: var(--ac-grad);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 10px 26px -6px rgba(79, 70, 229, 0.6);
        z-index: 1080;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .ac-fab::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.45);
        animation: ac-pulse 2.4s ease-out infinite;
      }
      .ac-fab:hover {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 16px 34px -8px rgba(79, 70, 229, 0.75);
      }
      @keyframes ac-pulse {
        0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.5); }
        70% { box-shadow: 0 0 0 16px rgba(79, 70, 229, 0); }
        100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
      }

      .ac-panel {
        position: fixed;
        right: 24px;
        bottom: 98px;
        width: 372px;
        max-width: calc(100vw - 32px);
        height: 520px;
        max-height: calc(100vh - 130px);
        display: flex;
        flex-direction: column;
        background: var(--ac-surface);
        border: 1px solid rgba(15, 23, 42, 0.06);
        border-radius: 18px;
        box-shadow: 0 24px 60px -16px rgba(8, 13, 33, 0.4);
        overflow: hidden;
        z-index: 1080;
        animation: ac-rise 0.22s cubic-bezier(0.32, 0.72, 0.4, 1) both;
      }
      @keyframes ac-rise {
        from { opacity: 0; transform: translateY(14px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .ac-panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 13px 16px;
        background: var(--ac-grad);
        color: #fff;
        position: relative;
      }
      .ac-panel__header::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(20rem 8rem at 90% -50%, rgba(255, 255, 255, 0.25), transparent 60%);
        pointer-events: none;
      }
      .ac-panel__id {
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
        z-index: 1;
      }
      .ac-avatar {
        width: 36px;
        height: 36px;
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex-shrink: 0;
      }
      .ac-panel__meta {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .ac-panel__title {
        font-weight: 700;
        font-size: 0.98rem;
        letter-spacing: -0.01em;
      }
      .ac-panel__status {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
      }
      .ac-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #4ade80;
        box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
        animation: ac-online 2s ease-out infinite;
      }
      @keyframes ac-online {
        0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
        70% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
        100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
      }
      .ac-panel__close {
        border: none;
        background: transparent;
        color: #fff;
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        position: relative;
        z-index: 1;
        transition: background 0.15s ease;
      }
      .ac-panel__close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .ac-panel__body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background:
          radial-gradient(30rem 16rem at 100% 0%, rgba(6, 182, 212, 0.06), transparent 60%),
          var(--ac-body-bg);
      }

      .ac-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        animation: ac-bubble-in 0.2s ease-out both;
      }
      .ac-row--user { align-items: flex-end; }
      @keyframes ac-bubble-in {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .ac-bubble {
        max-width: 86%;
        padding: 10px 13px;
        border-radius: 16px;
        font-size: 0.9rem;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .ac-bubble--bot {
        background: var(--ac-bot-bg);
        color: var(--ac-text);
        border: 1px solid var(--ac-bot-border);
        border-bottom-left-radius: 5px;
        box-shadow: 0 2px 8px -4px rgba(8, 13, 33, 0.12);
      }
      .ac-bubble--user {
        background: var(--ac-grad);
        color: #fff;
        border-bottom-right-radius: 5px;
        box-shadow: 0 6px 16px -8px rgba(79, 70, 229, 0.6);
      }
      .ac-bubble--typing { padding: 12px 14px; }

      .ac-typing {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }
      .ac-typing i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--ac-brand);
        opacity: 0.5;
        animation: ac-typing 1.1s infinite ease-in-out;
      }
      .ac-typing i:nth-child(2) { animation-delay: 0.15s; }
      .ac-typing i:nth-child(3) { animation-delay: 0.3s; }
      @keyframes ac-typing {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-4px); opacity: 1; }
      }

      .ac-accion {
        border: 1px solid var(--ac-brand);
        background: #fff;
        color: var(--ac-brand);
        font-size: 0.82rem;
        font-weight: 600;
        padding: 6px 14px;
        border-radius: 999px;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
      }
      .ac-accion:hover {
        background: var(--ac-grad);
        border-color: transparent;
        color: #fff;
        transform: translateY(-1px);
      }

      .ac-panel__input {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #eceff5;
        background: #fff;
      }
      .ac-panel__input .form-control {
        flex: 1 1 auto;
        border-radius: 999px;
        padding: 0.6rem 0.95rem;
        border-color: #dbe2ee;
      }
      .ac-panel__input .form-control:focus {
        border-color: var(--ac-brand);
        box-shadow: 0 0 0 0.2rem rgba(79, 70, 229, 0.18);
      }

      .ac-send {
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        border: none;
        border-radius: 50%;
        background: var(--ac-grad);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 6px 16px -6px rgba(79, 70, 229, 0.6);
        transition: transform 0.12s ease, filter 0.15s ease;
      }
      .ac-send:hover:not(:disabled) { transform: scale(1.06); filter: brightness(1.05); }
      .ac-send:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
    `,
  ],
})
export class AsistenteChatComponent implements AfterViewChecked {
  private readonly agente = inject(AgenteService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly scrollBox = viewChild<ElementRef<HTMLDivElement>>('scrollBox');

  protected readonly abierto = signal(false);
  protected readonly cargando = signal(false);
  protected readonly consulta = signal('');
  protected readonly mensajes = signal<ChatMensaje[]>([]);

  protected readonly visible = computed(() => !!this.auth.usuario());

  private autoScroll = false;

  ngAfterViewChecked(): void {
    if (this.autoScroll) {
      const el = this.scrollBox()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
      this.autoScroll = false;
    }
  }

  protected toggle(): void {
    const abrir = !this.abierto();
    this.abierto.set(abrir);
    if (abrir && this.mensajes().length === 0) {
      this.mensajes.set([
        {
          texto: 'Hola, soy tu asistente. ¿En qué puedo ayudarte?',
          delUsuario: false,
        },
      ]);
      this.autoScroll = true;
    }
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  protected enviar(): void {
    const texto = this.consulta().trim();
    if (!texto || this.cargando()) {
      return;
    }

    this.mensajes.update((m) => [...m, { texto, delUsuario: true }]);
    this.consulta.set('');
    this.cargando.set(true);
    this.autoScroll = true;

    this.agente.consultar(texto, this.router.url).subscribe({
      next: (res) => {
        this.mensajes.update((m) => [
          ...m,
          {
            texto: res.respuesta,
            delUsuario: false,
            accion: res.accion ?? null,
          },
        ]);
        this.cargando.set(false);
        this.autoScroll = true;
      },
      error: (err: unknown) => {
        this.mensajes.update((m) => [
          ...m,
          { texto: mensajeAmigable(err), delUsuario: false },
        ]);
        this.cargando.set(false);
        this.autoScroll = true;
      },
    });
  }

  protected ejecutarAccion(accion: AgenteAccion): void {
    if (!accion?.ruta) {
      return;
    }
    this.router.navigate([accion.ruta]);
    this.cerrar();
  }
}
