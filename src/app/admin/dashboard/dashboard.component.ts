import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  LucideAngularModule,
  LucideIconData,
  LayoutDashboard,
  Activity,
  CheckCircle2,
  FileStack,
  RefreshCw,
  Building2,
  Clock,
  ScrollText,
} from 'lucide-angular';
import { MetricasService } from '../../core/services/metricas.service';

interface Conteo {
  nombre: string;
  total: number;
}
interface Promedio {
  nombre: string;
  promedioHoras: number;
  muestras: number;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <section class="app-shell-inner cre-fade-in" style="padding-top: 1.5rem;">
      <!-- Encabezado -->
      <header class="dash-head">
        <div class="dash-head-left">
          <span class="dash-head-icon">
            <lucide-icon [img]="ic.dashboard" [size]="22"></lucide-icon>
          </span>
          <div>
            <h1 class="dash-title">Dashboard</h1>
            <p class="dash-subtitle">Monitoreo en tiempo real de la operación.</p>
          </div>
        </div>
        <button class="cre-btn cre-btn-secondary cre-btn-sm" type="button" (click)="cargar()">
          <lucide-icon [img]="ic.refresh" [size]="15"></lucide-icon>
          Actualizar
        </button>
      </header>

      @if (error()) {
        <div class="alert alert-danger">{{ error() }}</div>
      }

      @if (data(); as d) {
        <!-- KPIs -->
        <div class="kpi-grid">
          <article class="kpi-card cre-card cre-card-hover">
            <span class="kpi-accent" style="background: var(--cre-gradient-brand);"></span>
            <div class="kpi-top">
              <span class="kpi-icon kpi-icon--brand">
                <lucide-icon [img]="ic.total" [size]="22"></lucide-icon>
              </span>
              <span class="cre-badge cre-badge-brand">Total</span>
            </div>
            <div class="kpi-value">{{ d.totalTramites }}</div>
            <div class="kpi-label">Trámites totales</div>
            <div class="kpi-foot">Registro histórico completo</div>
          </article>

          <article class="kpi-card cre-card cre-card-hover">
            <span class="kpi-accent" style="background: linear-gradient(135deg, #14b8a6, #2dd4bf);"></span>
            <div class="kpi-top">
              <span class="kpi-icon kpi-icon--accent">
                <lucide-icon [img]="ic.activos" [size]="22"></lucide-icon>
              </span>
              <span class="cre-badge cre-badge-info">En curso</span>
            </div>
            <div class="kpi-value">{{ d.activos }}</div>
            <div class="kpi-label">Activos</div>
            <div class="kpi-bar">
              <span class="kpi-bar-fill" [style.width.%]="pct(d.activos, d.totalTramites)"
                    style="background: linear-gradient(90deg, #0d9488, #2dd4bf);"></span>
            </div>
            <div class="kpi-foot">{{ pct(d.activos, d.totalTramites) }}% del total</div>
          </article>

          <article class="kpi-card cre-card cre-card-hover">
            <span class="kpi-accent" style="background: linear-gradient(135deg, #16a34a, #4ade80);"></span>
            <div class="kpi-top">
              <span class="kpi-icon kpi-icon--success">
                <lucide-icon [img]="ic.cerrados" [size]="22"></lucide-icon>
              </span>
              <span class="cre-badge cre-badge-success">Finalizados</span>
            </div>
            <div class="kpi-value">{{ d.cerrados }}</div>
            <div class="kpi-label">Cerrados</div>
            <div class="kpi-bar">
              <span class="kpi-bar-fill" [style.width.%]="pct(d.cerrados, d.totalTramites)"
                    style="background: linear-gradient(90deg, #16a34a, #4ade80);"></span>
            </div>
            <div class="kpi-foot">{{ pct(d.cerrados, d.totalTramites) }}% completados</div>
          </article>
        </div>

        <!-- Gráficos de barras -->
        <div class="panel-grid">
          <section class="cre-card panel">
            <header class="panel-head">
              <span class="panel-dot" style="background: var(--cre-gradient-brand);"></span>
              <h2 class="panel-title">Trámites por estado</h2>
            </header>
            <div class="panel-body">
              @for (b of barras(d.porEstado); track b.nombre) {
                <div class="bar-row">
                  <span class="bar-name" [title]="b.nombre">{{ b.nombre }}</span>
                  <span class="bar-track">
                    <span class="bar-fill" [style.width.%]="b.pct"
                          style="background: var(--cre-gradient-brand);"></span>
                  </span>
                  <span class="bar-val">{{ b.total }}</span>
                </div>
              } @empty {
                <span class="panel-empty">Sin datos.</span>
              }
            </div>
          </section>

          <section class="cre-card panel">
            <header class="panel-head">
              <span class="panel-dot" style="background: linear-gradient(135deg, #14b8a6, #5eead4);"></span>
              <h2 class="panel-title">Carga actual por departamento</h2>
            </header>
            <div class="panel-body">
              @for (b of barras(d.cargaPorDepartamento); track b.nombre) {
                <div class="bar-row">
                  <span class="bar-name" [title]="b.nombre">{{ b.nombre }}</span>
                  <span class="bar-track">
                    <span class="bar-fill" [style.width.%]="b.pct"
                          style="background: linear-gradient(90deg, #0d9488, #5eead4);"></span>
                  </span>
                  <span class="bar-val">{{ b.total }}</span>
                </div>
              } @empty {
                <span class="panel-empty">Sin trámites activos.</span>
              }
            </div>
          </section>

          <section class="cre-card panel">
            <header class="panel-head">
              <span class="panel-icon"><lucide-icon [img]="ic.depto" [size]="16"></lucide-icon></span>
              <h2 class="panel-title">Tiempo promedio por departamento</h2>
              <span class="panel-unit">horas</span>
            </header>
            <div class="panel-body">
              @for (p of d.promedioPorDepartamento; track p.nombre) {
                <div class="stat-row">
                  <span class="stat-name">{{ p.nombre }}</span>
                  <span class="stat-meta">
                    <strong class="stat-val">{{ p.promedioHoras }}</strong> h
                    <span class="stat-samples">{{ p.muestras }} muestras</span>
                  </span>
                </div>
              } @empty {
                <span class="panel-empty">Aún no hay métricas de actividades completadas.</span>
              }
            </div>
          </section>

          <section class="cre-card panel">
            <header class="panel-head">
              <span class="panel-icon"><lucide-icon [img]="ic.politica" [size]="16"></lucide-icon></span>
              <h2 class="panel-title">Tiempo promedio por política</h2>
              <span class="panel-unit">horas</span>
            </header>
            <div class="panel-body">
              @for (p of d.promedioPorPolitica; track p.nombre) {
                <div class="stat-row">
                  <span class="stat-name">{{ p.nombre }}</span>
                  <span class="stat-meta">
                    <strong class="stat-val">{{ p.promedioHoras }}</strong> h
                    <span class="stat-samples">{{ p.muestras }} muestras</span>
                  </span>
                </div>
              } @empty {
                <span class="panel-empty">Aún no hay métricas de actividades completadas.</span>
              }
            </div>
          </section>
        </div>
      } @else if (!error()) {
        <div class="dash-loading">
          <span class="spinner-border spinner-border-sm me-2"></span>Cargando métricas…
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }

      /* Encabezado */
      .dash-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      .dash-head-left { display: flex; align-items: center; gap: 0.9rem; }
      .dash-head-icon {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border-radius: var(--cre-radius-md);
        color: #fff;
        background: var(--cre-gradient-brand);
        box-shadow: var(--cre-shadow-signal);
        flex-shrink: 0;
      }
      .dash-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--cre-text);
      }
      .dash-subtitle { margin: 0; font-size: 0.85rem; color: var(--cre-text-muted); }

      /* KPIs */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.1rem;
        margin-bottom: 1.4rem;
      }
      @media (max-width: 900px) { .kpi-grid { grid-template-columns: 1fr; } }
      .kpi-card {
        position: relative;
        padding: 1.3rem 1.35rem 1.25rem;
        overflow: hidden;
      }
      .kpi-accent {
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;
      }
      .kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.85rem;
      }
      .kpi-icon {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: var(--cre-radius-md);
      }
      .kpi-icon--brand   { color: var(--cre-brand-700);  background: color-mix(in srgb, var(--cre-brand-500) 14%, transparent); }
      .kpi-icon--accent  { color: var(--cre-energy-700); background: color-mix(in srgb, var(--cre-energy-500) 16%, transparent); }
      .kpi-icon--success { color: var(--cre-success-600); background: color-mix(in srgb, var(--cre-success-500) 16%, transparent); }
      .kpi-value {
        font-size: 2.4rem;
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.03em;
        color: var(--cre-text);
      }
      .kpi-label {
        margin-top: 0.35rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--cre-text-muted);
      }
      .kpi-bar {
        margin-top: 0.85rem;
        height: 7px;
        border-radius: 999px;
        background: var(--cre-bg-muted);
        overflow: hidden;
      }
      .kpi-bar-fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        transition: width 600ms cubic-bezier(0.32, 0.72, 0.4, 1);
      }
      .kpi-foot {
        margin-top: 0.6rem;
        font-size: 0.76rem;
        color: var(--cre-text-subtle);
      }

      /* Paneles */
      .panel-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1.1rem;
      }
      @media (max-width: 900px) { .panel-grid { grid-template-columns: 1fr; } }
      .panel { display: flex; flex-direction: column; }
      .panel-head {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 1rem 1.2rem;
        border-bottom: 1px solid var(--cre-border);
      }
      .panel-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
      .panel-icon {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 9px;
        color: var(--cre-brand-700);
        background: color-mix(in srgb, var(--cre-brand-500) 12%, transparent);
        flex-shrink: 0;
      }
      .panel-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--cre-text);
        flex: 1;
      }
      .panel-unit {
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--cre-text-subtle);
      }
      .panel-body { padding: 1.1rem 1.2rem; flex: 1; }
      .panel-empty { font-size: 0.85rem; color: var(--cre-text-muted); }

      /* Barras */
      .bar-row {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin-bottom: 0.85rem;
      }
      .bar-row:last-child { margin-bottom: 0; }
      .bar-name {
        width: 34%;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--cre-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bar-track {
        flex: 1;
        height: 0.85rem;
        border-radius: 999px;
        background: var(--cre-bg-muted);
        overflow: hidden;
      }
      .bar-fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        transition: width 600ms cubic-bezier(0.32, 0.72, 0.4, 1);
      }
      .bar-val {
        width: 2.5rem;
        text-align: right;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--cre-text);
      }

      /* Stats */
      .stat-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.6rem 0;
        border-bottom: 1px solid var(--cre-border);
      }
      .stat-row:last-child { border-bottom: 0; }
      .stat-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--cre-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .stat-meta { font-size: 0.82rem; color: var(--cre-text-muted); white-space: nowrap; }
      .stat-val { color: var(--cre-brand-700); font-size: 0.95rem; }
      .stat-samples {
        margin-left: 0.5rem;
        font-size: 0.7rem;
        color: var(--cre-text-subtle);
      }

      .dash-loading {
        text-align: center;
        color: var(--cre-text-muted);
        padding: 3rem 0;
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly metricas = inject(MetricasService);

  readonly data = signal<any | null>(null);
  readonly error = signal('');

  protected readonly ic = {
    dashboard: LayoutDashboard as LucideIconData,
    refresh: RefreshCw as LucideIconData,
    total: FileStack as LucideIconData,
    activos: Activity as LucideIconData,
    cerrados: CheckCircle2 as LucideIconData,
    depto: Building2 as LucideIconData,
    politica: ScrollText as LucideIconData,
    reloj: Clock as LucideIconData,
  };

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.metricas.getDashboard().subscribe({
      next: (d) => this.data.set(d),
      error: () => this.error.set('No se pudieron cargar las métricas del dashboard.'),
    });
  }

  barras(lista: Conteo[] | undefined): (Conteo & { pct: number })[] {
    const l = lista ?? [];
    const max = Math.max(1, ...l.map((x) => x.total));
    return l.map((x) => ({ ...x, pct: Math.round((x.total / max) * 100) }));
  }

  pct(parte: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.round((parte / total) * 100);
  }
}
