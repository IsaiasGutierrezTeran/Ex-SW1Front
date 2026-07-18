import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Breadcrumb {
  label: string;
  link?: string;
}

/**
 * Cabecera de página consistente para todas las pantallas.
 * Uso:
 *   <app-page-header title="Usuarios" [breadcrumbs]="[{label:'Admin'},{label:'Usuarios'}]">
 *     <button actions class="btn btn-primary">+ Nuevo</button>
 *   </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="ph-main">
        @if (breadcrumbs().length) {
          <nav class="ph-crumbs" aria-label="Ruta de navegación">
            @for (c of breadcrumbs(); track $index; let last = $last) {
              @if (c.link && !last) {
                <a [routerLink]="c.link" class="ph-crumb">{{ c.label }}</a>
              } @else {
                <span class="ph-crumb" [class.current]="last" [attr.aria-current]="last ? 'page' : null">{{ c.label }}</span>
              }
              @if (!last) {
                <span class="ph-sep" aria-hidden="true">/</span>
              }
            }
          </nav>
        }
        <h1 class="page-title ph-title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="ph-subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="ph-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </header>
  `,
  styleUrl: './page-header.component.css',
})
export class PageHeaderComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly breadcrumbs = input<Breadcrumb[]>([]);
}
