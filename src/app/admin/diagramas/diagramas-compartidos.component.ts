import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  ColaboracionService,
  CompartidoConmigo,
} from '../../core/services/colaboracion.service';
import { mensajeAmigable } from '../../core/utils/error-messages';

import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-diagramas-compartidos',
  imports: [DatePipe, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container-fluid py-4">
      <app-page-header
        title="Compartidos conmigo"
        subtitle="Diagramas a los que te invitaron a colaborar (solo por invitación)."
        [breadcrumbs]="[{ label: 'Flujos' }, { label: 'Compartidos' }]"
      ></app-page-header>

      @if (error()) {
        <div class="alert alert-danger" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Cargando…
        </div>
      } @else {
        @if (pendientes().length) {
          <h2 class="h6 text-muted mt-2 mb-2">Invitaciones pendientes</h2>
          <div class="row g-3 mb-4">
            @for (c of pendientes(); track c.colaboracionId) {
              <div class="col-md-6 col-lg-4">
                <div class="card border-warning shadow-sm h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <h3 class="h6 mb-0">{{ c.diagramaNombre }}</h3>
                      <span class="badge {{ permisoBadge(c.permisos) }}">{{ permisoLabel(c.permisos) }}</span>
                    </div>
                    @if (c.politicaNombre) {
                      <div class="small text-muted mb-1">Política: {{ c.politicaNombre }}</div>
                    }
                    <div class="small text-muted mb-3">Te invitó: {{ c.invitadoPor }}</div>
                    <div class="d-flex gap-2">
                      <button
                        class="btn btn-sm btn-success"
                        (click)="responder(c, 'ACEPTAR')"
                        [disabled]="procesandoId() === c.colaboracionId"
                      >
                        Aceptar
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger"
                        (click)="responder(c, 'RECHAZAR')"
                        [disabled]="procesandoId() === c.colaboracionId"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <h2 class="h6 text-muted mt-2 mb-2">Diagramas compartidos</h2>
        @if (aceptadas().length === 0) {
          <div class="text-center text-muted py-5 border rounded bg-light">
            Aún no tienes diagramas compartidos contigo.
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle tabla-cards">
              <thead class="table-light">
                <tr>
                  <th>Diagrama</th>
                  <th>Política</th>
                  <th>Permiso</th>
                  <th>Te invitó</th>
                  <th>Desde</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (c of aceptadas(); track c.colaboracionId) {
                  <tr>
                    <td data-label="Diagrama" class="fw-semibold">{{ c.diagramaNombre }}</td>
                    <td data-label="Política">{{ c.politicaNombre || '—' }}</td>
                    <td data-label="Permiso"><span class="badge {{ permisoBadge(c.permisos) }}">{{ permisoLabel(c.permisos) }}</span></td>
                    <td data-label="Te invitó">{{ c.invitadoPor }}</td>
                    <td data-label="Desde" class="small text-muted">
                      {{ c.fechaRespuesta ? (c.fechaRespuesta | date: 'short') : '—' }}
                    </td>
                    <td data-label="Detalle" class="text-end">
                      <a class="btn btn-sm btn-primary" [routerLink]="[baseDiagramas(), c.diagramaId]">
                        Abrir diagrama
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
})
export class DiagramasCompartidosComponent {
  private readonly svc = inject(ColaboracionService);
  private readonly auth = inject(AuthService);

  readonly baseDiagramas = computed(() =>
    this.auth.isAdmin() ? '/admin/diagramas' : '/funcionario/diagramas',
  );

  readonly items = signal<CompartidoConmigo[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly procesandoId = signal<string | null>(null);

  readonly pendientes = computed(() => this.items().filter((i) => i.estado === 'pendiente'));
  readonly aceptadas = computed(() => this.items().filter((i) => i.estado === 'aceptada'));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc.compartidosConmigo().subscribe({
      next: (lista) => {
        this.items.set(lista);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(mensajeAmigable(err));
        this.loading.set(false);
      },
    });
  }

  responder(c: CompartidoConmigo, decision: 'ACEPTAR' | 'RECHAZAR'): void {
    if (this.procesandoId() === c.colaboracionId) return;
    this.procesandoId.set(c.colaboracionId);
    this.svc.responderInvitacion(c.colaboracionId, decision).subscribe({
      next: () => {
        this.procesandoId.set(null);
        if (decision === 'RECHAZAR') {
          this.items.update((l) => l.filter((x) => x.colaboracionId !== c.colaboracionId));
        } else {
          this.items.update((l) =>
            l.map((x) =>
              x.colaboracionId === c.colaboracionId ? { ...x, estado: 'aceptada' } : x,
            ),
          );
        }
      },
      error: (err) => {
        this.procesandoId.set(null);
        this.error.set(mensajeAmigable(err));
      },
    });
  }

  private esSoloLectura(p: string): boolean {
    return p === 'visualizador' || p === 'visor';
  }

  permisoBadge(p: string): string {
    return this.esSoloLectura(p) ? 'bg-secondary' : 'bg-primary';
  }

  permisoLabel(p: string): string {
    return this.esSoloLectura(p) ? 'Solo lectura' : 'Editor';
  }
}
