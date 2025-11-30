import { Directive, ElementRef, inject } from '@angular/core';

let slInputIdCounter = 0;
const patchedInputs = new WeakSet<HTMLInputElement>();

/**
 * Directive to ensure Shoelace input components have unique internal input IDs.
 * Shoelace generates internal inputs with hardcoded id="input", causing DOM duplication warnings.
 * This directive hijacks the setAttribute method to intercept ID changes.
 */
@Directive({
  selector: 'sl-input',
  standalone: true,
})
export class SlInputUniqueIdDirective {
  private readonly elementRef = inject(ElementRef);

  constructor() {
    const slInput = this.elementRef.nativeElement as any;
    const uniqueId = `sl-input-${++slInputIdCounter}`;

    // We need to wait for Shoelace to initialize its shadow DOM
    const checkAndPatch = () => {
      const shadowRoot = slInput.shadowRoot;
      if (shadowRoot) {
        const input = shadowRoot.querySelector('input[part="input"]') as HTMLInputElement;
        if (input && !patchedInputs.has(input)) {
          patchedInputs.add(input);
          // Replace the setAttribute to intercept "id" changes
          const originalSet = input.setAttribute.bind(input);
          input.setAttribute = (name: string, value: string) => {
            if (name === 'id' && value === 'input') {
              originalSet('id', uniqueId);
            } else {
              originalSet(name, value);
            }
          };
          // Also set it if it's already there
          if (input.id === 'input') {
            input.id = uniqueId;
          }
        }
      }
    };

    // Check immediately and then repeatedly
    checkAndPatch();
    const interval = setInterval(() => {
      checkAndPatch();
      const input = slInput.shadowRoot?.querySelector('input[part="input"]');
      if (input && input.id === uniqueId) {
        clearInterval(interval);
      }
    }, 10);

    // Clean up after 2 seconds
    setTimeout(() => clearInterval(interval), 2000);
  }
}
