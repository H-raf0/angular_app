import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Placeholder service to integrate backend chart/stock data later.
 * Currently returns local mock values. Replace implementations with real
 * HTTP calls when the backend API is available.
 */
@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  constructor() {}

  getStockHistory(stockId: string): Observable<number[]> {
    // TODO: Call backend API to fetch historical prices for `stockId`.
    // For now return an empty series so components can subscribe safely.
    return of([]);
  }

  // Future helpers: postBuyEvent(stockId, quantity), postSellEvent(...)
}
