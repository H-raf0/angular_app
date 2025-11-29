import { Directive, ElementRef, inject, model } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appSlSelectControl]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: AppSlSelectControlDirective,
      multi: true,
    },
  ],
  host: {
    '(sl-change)': 'onSlChange()',
  },
})
export class AppSlSelectControlDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef);

  // onChange receives the new value from the control
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onChangeFn: (value: any) => void = () => {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouchedFn = () => {};

  readonly value = model('');

  // When Angular writes a value into the control, update the web component
  writeValue(value: string | null): void {
    const v = value ?? '';
    this.value.set(v);
    try {
      // Update the native element property so the sl-select reflects the value
      if (this.el && this.el.nativeElement) {
        // assign property rather than attribute
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.el.nativeElement as any).value = v;
      }
    } catch {
      // ignore DOM errors
    }
  }

  // register change/touch callbacks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnChange(function_: (value: any) => void): void {
    this.onChangeFn = function_;
  }

  registerOnTouched(function_: () => void): void {
    this.onTouchedFn = function_;
  }

  onSlChange(): void {
    const { value } = this.el.nativeElement;
    this.onChangeFn(value);
    this.onTouchedFn();
  }
}
