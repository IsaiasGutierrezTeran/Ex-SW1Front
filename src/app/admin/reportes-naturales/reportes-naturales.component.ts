import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReporteNaturalResponse } from '../../core/models/reporte-natural.model';
import { ReporteNaturalService } from '../../core/services/reporte-natural.service';
import { mensajeAmigable } from '../../core/utils/error-messages';

import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-reportes-naturales',
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './reportes-naturales.component.html',
  styleUrl: './reportes-naturales.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesNaturalesComponent {
  private readonly svc = inject(ReporteNaturalService);

  readonly consulta = signal('');
  readonly resultado = signal<ReporteNaturalResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly dictando = signal(false);

  readonly ejemplos = [
    'conteo de tramites por estado',
    'tramites entre el 1 y el 15 de mayo',
    'cuantos tramites hay agrupados',
    'listar todos los tramites recientes',
  ];

  readonly columnas = computed<string[]>(() => {
    const r = this.resultado();
    if (!r || !r.filasMuestra.length) return [];
    return Object.keys(r.filasMuestra[0]);
  });

  readonly esConteo = computed<boolean>(() => {
    const cols = this.columnas();
    return cols.length === 2 && cols.includes('total');
  });

  readonly chart = computed<{ label: string; value: number; pct: number }[]>(() => {
    const r = this.resultado();
    if (!r || !this.esConteo()) return [];
    const labelCol = this.columnas().find((c) => c !== 'total')!;
    const rows = r.filasMuestra.map((f) => ({
      label: this.formatear((f as any)[labelCol]),
      value: Number((f as any)['total']) || 0,
    }));
    const max = Math.max(1, ...rows.map((x) => x.value));
    return rows.map((x) => ({ ...x, pct: Math.round((x.value / max) * 100) }));
  });

  ejecutar(): void {
    const consulta = this.consulta().trim();
    if (!consulta || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.resultado.set(null);

    this.svc.generar({ consulta, formatoExport: 'JSON' }).subscribe({
      next: (resp) => {
        this.resultado.set(resp);
        this.loading.set(false);
      },
      error: (err: any) => {
        const code = err?.status ?? 0;
        const msg = err?.error?.message ?? err?.error?.error ?? '';
        if (code === 503) {
          this.error.set(
            'El microservicio IA no está disponible. La consulta natural requiere IA.',
          );
        } else if (msg.includes('RPT_COLECCION_NO_PERMITIDA')) {
          this.error.set('La IA generó una consulta sobre una colección no permitida.');
        } else if (msg.includes('RPT_PIPELINE_INVALIDO')) {
          this.error.set('La IA generó un pipeline inválido (operadores prohibidos).');
        } else {
          this.error.set(mensajeAmigable(err));
        }
        this.loading.set(false);
      },
    });
  }

  usarEjemplo(ej: string): void {
    this.consulta.set(ej);
  }

  /**
   * Dictado por RECONOCIMIENTO DE VOZ del navegador (Web Speech API, es-ES).
   * Transcribe de verdad lo que dices (no depende del microservicio) y, si en la
   * frase mencionas un formato ("en Excel" / "en PDF"), genera el reporte y lo
   * descarga automáticamente en ese formato.
   */
  dictarPorVoz(): void {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      this.error.set(
        'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge de escritorio.',
      );
      return;
    }
    const rec = new SR();
    rec.lang = 'es-ES';
    rec.interimResults = true; // capturamos parciales: más robusto en redes lentas
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let texto = '';
    let errCode = '';
    this.dictando.set(true);
    this.error.set('');

    rec.onresult = (ev: any) => {
      for (let i = 0; i < ev.results.length; i++) {
        const r = String(ev.results[i]?.[0]?.transcript ?? '');
        if (r.trim()) texto = r; // nos quedamos con la transcripción más reciente
      }
    };
    rec.onerror = (ev: any) => {
      errCode = ev?.error || 'desconocido';
    };
    rec.onend = () => {
      this.dictando.set(false);
      const t = texto.trim();
      if (t) {
        this.consulta.set(t);
        this.ejecutarConFormato(t);
        return;
      }
      const msgs: Record<string, string> = {
        'not-allowed':
          'Permiso de micrófono denegado. Actívalo en el candado de la barra de direcciones y reintenta.',
        'service-not-allowed':
          'El navegador bloqueó el reconocimiento. Usa Chrome o Edge de escritorio.',
        'no-speech':
          'No se detectó voz. Habla cerca del micrófono e intenta de nuevo.',
        'audio-capture':
          'No se detectó micrófono. Conecta uno y reintenta.',
        network:
          'La red bloqueó el reconocimiento de voz (necesita internet sin proxy/VPN). Prueba otra red o escribe la consulta.',
        aborted: 'Se canceló el reconocimiento. Intenta de nuevo.',
      };
      this.error.set(
        msgs[errCode] ||
          `No se pudo reconocer la voz (${errCode || 'sin resultado'}). Intenta de nuevo o escribe la consulta.`,
      );
    };

    try {
      rec.start();
    } catch {
      this.dictando.set(false);
      this.error.set('No se pudo iniciar el micrófono. Intenta de nuevo.');
    }
  }

  /** Detecta el formato pedido por voz, genera el reporte y lo descarga solo. */
  private ejecutarConFormato(texto: string): void {
    const t = texto.toLowerCase();
    const formato: 'xlsx' | 'pdf' | null = /\b(excel|xlsx|hoja de c[aá]lculo)\b/.test(t)
      ? 'xlsx'
      : /\bpdf\b/.test(t)
        ? 'pdf'
        : null;

    const consulta = texto.trim();
    this.loading.set(true);
    this.error.set('');
    this.resultado.set(null);
    this.svc.generar({ consulta, formatoExport: 'JSON' }).subscribe({
      next: (resp) => {
        this.resultado.set(resp);
        this.loading.set(false);
        if (formato) this.exportarArchivo(formato); // descarga automática
      },
      error: (err: any) => {
        this.error.set(mensajeAmigable(err));
        this.loading.set(false);
      },
    });
  }

  limpiar(): void {
    this.consulta.set('');
    this.resultado.set(null);
    this.error.set('');
  }

  formatear(valor: unknown): string {
    if (valor == null) return '—';
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
  }

  exportarArchivo(formato: 'xlsx' | 'pdf'): void {
    const consulta = this.consulta().trim();
    if (!consulta) return;
    this.svc.exportar(consulta, formato).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte.${formato}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err: any) => this.error.set(mensajeAmigable(err)),
    });
  }

  exportarCsv(): void {
    const r = this.resultado();
    if (!r || !r.filasMuestra.length) return;
    const cols = this.columnas();
    const escape = (v: unknown) => {
      const s = this.formatear(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lineas = [cols.join(',')];
    for (const f of r.filasMuestra) {
      lineas.push(cols.map((c) => escape((f as any)[c])).join(','));
    }
    const csv = lineas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${r.reporteId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
