import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte identificadores snake_case / kebab-case en texto legible:
 *   "tiempo_atipico"     -> "tiempo atipico"
 *   "salto_no_autorizado"-> "salto no autorizado"
 * Solo afecta la PRESENTACIÓN; el valor de datos original no se toca.
 */
@Pipe({
  name: 'humanize',
  standalone: true,
})
export class HumanizePipe implements PipeTransform {
  transform(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).replace(/[_-]+/g, ' ').trim();
  }
}
