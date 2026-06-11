import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DictarFormularioResponse } from '../../core/models/dictado-formulario.model';
import { DictadoService } from '../../core/services/dictado.service';
import { mensajeAmigable } from '../../core/utils/error-messages';
import { GrabadorVozComponent } from '../grabador-voz/grabador-voz.component';

@Component({
  selector: 'app-dictar-seccion',
  imports: [GrabadorVozComponent, DecimalPipe],
  templateUrl: './dictar-seccion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DictarSeccionComponent {
  private readonly svc = inject(DictadoService);

  readonly seccionId = input.required<string>();

  readonly aplicado = output<DictarFormularioResponse>();

  readonly resultado = signal<DictarFormularioResponse | null>(null);
  readonly error = signal('');
  readonly procesando = signal(false);

  onAudio(blob: Blob): void {
    this.procesando.set(true);
    this.error.set('');
    this.svc.dictarSeccion(this.seccionId(), blob).subscribe({
      next: (resp) => {
        this.resultado.set(resp);
        this.procesando.set(false);
      },
      error: (err: any) => {
        this.procesando.set(false);
        const code = err?.status ?? 0;
        if (code === 503) {
          this.error.set('El microservicio IA no está disponible. Intenta más tarde.');
        } else {
          this.error.set(mensajeAmigable(err, 'No se pudo procesar el dictado.'));
        }
      },
    });
  }

  reintentar(): void {
    this.error.set('');
    this.resultado.set(null);
  }

  limpiar(): void {
    this.resultado.set(null);
    this.error.set('');
  }

  aplicar(): void {
    const r = this.resultado();
    if (r) this.aplicado.emit(r);
  }

  badgeConfianza(c: number): string {
    if (c >= 0.7) return 'bg-success';
    if (c >= 0.4) return 'bg-warning text-dark';
    return 'bg-secondary';
  }
}
