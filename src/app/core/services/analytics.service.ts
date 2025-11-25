import { DOCUMENT, inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);

  loadGA4Script() {
    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=G-9SZHZ6B85Z`;
    // eslint-disable-next-line unicorn/prefer-dom-node-append
    this.document.head.appendChild(script);
  }

  // Removed getRealtimeUsersResource - analytics endpoint no longer available
}
