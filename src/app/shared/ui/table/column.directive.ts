import { Directive, inject, input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appColumn]',
  standalone: true,
})
export class ColumnTemplateDirective {
  readonly key = input.required<string>({ alias: 'appColumn' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
