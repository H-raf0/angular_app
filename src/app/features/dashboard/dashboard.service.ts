import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '~core/tokens/environment.token';

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceHistory: number[];
  change: number; // percentage
}

export interface Portfolio {
  balance: number;
  stocks: { [key: string]: number }; // symbol -> quantity
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private mockStocks: Stock[] = [
    {
      id: '1',
      symbol: 'TECH',
      name: 'TechCorp',
      price: 150.25,
      priceHistory: [120, 125, 130, 135, 140, 145, 148, 150, 152, 150.25],
      change: 5.2,
    },
    {
      id: '2',
      symbol: 'FIN',
      name: 'FinanceInc',
      price: 95.8,
      priceHistory: [90, 92, 94, 93, 95, 96, 95.5, 96, 96.5, 95.8],
      change: 3.1,
    },
    {
      id: '3',
      symbol: 'ENERGY',
      name: 'EnergyPlus',
      price: 78.5,
      priceHistory: [75, 76, 77, 78, 77.5, 78, 78.2, 78.8, 78.3, 78.5],
      change: 1.8,
    },
    {
      id: '4',
      symbol: 'HEALTH',
      name: 'HealthCare',
      price: 210.1,
      priceHistory: [200, 202, 205, 207, 208, 209, 210, 210.5, 210.2, 210.1],
      change: 2.1,
    },
  ];

  private portfolioSubject = new BehaviorSubject<Portfolio>({
    balance: 10000,
    stocks: {},
  });

  portfolio$: Observable<Portfolio> = this.portfolioSubject.asObservable();

  getStocks(): Stock[] {
    return this.mockStocks;
  }

  /**
   * Fetch latest stocks from backend.
   *
   * NOTE: This currently simulates a backend call and returns a Promise that
   * slightly perturbs the current mock prices. When your real backend is
   * available, replace the body with an `HttpClient` call such as:
   * `return this.http.get<Stock[]>('/api/stocks').toPromise();`
   */
  async fetchStocksFromBackend(): Promise<Stock[]> {
    const url = `${this.environment.apiBaseUrl}/api/stocks`;
    try {
      const result = await firstValueFrom(this.http.get<Stock[]>(url));
      if (result && Array.isArray(result)) {
        // update local cache
        this.mockStocks = result;
        return result;
      }
    } catch {
      // ignore and fall back to mock data
    }

    // fallback: small local perturbation to keep UI lively
    await new Promise((r) => setTimeout(r, 200));
    this.mockStocks = this.mockStocks.map((s) => {
      const prev = s.price;
      const rnd = (Math.random() - 0.5) * 0.02;
      const newPrice = Math.round(prev * (1 + rnd) * 100) / 100;
      const priceHistory = [...s.priceHistory, newPrice].slice(-20);
      const change = Math.round(((newPrice - prev) / prev) * 100 * 100) / 100;
      return { ...s, price: newPrice, priceHistory, change } as Stock;
    });

    return this.mockStocks;
  }

  getPortfolio(): Portfolio {
    return this.portfolioSubject.value;
  }

  addMoney(amount: number): void {
    // try to persist on backend; fall back to local update
    const url = `${this.environment.apiBaseUrl}/api/portfolio/addMoney`;
    void firstValueFrom(this.http.post<{ balance: number; stocks: Record<string, number> }>(url, { amount }))
      .then((res) => {
        this.portfolioSubject.next({ balance: res.balance, stocks: res.stocks });
      })
      .catch(() => {
        const current = this.portfolioSubject.value;
        this.portfolioSubject.next({
          ...current,
          balance: current.balance + amount,
        });
      });
  }

  buyStock(stockId: string, quantity: number): boolean {
    // Optimistic local check; delegate actual operation to backend
    const stock = this.mockStocks.find((s) => s.id === stockId);
    if (!stock) return false;

    const cost = stock.price * quantity;
    const current = this.portfolioSubject.value;
    if (current.balance < cost) return false;

    const url = `${this.environment.apiBaseUrl}/api/portfolio/buy`;
    // fire-and-forget: backend will validate; update local state optimistically
    void firstValueFrom(this.http.post<{ balance: number; stocks: Record<string, number> }>(url, { stockId, quantity }))
      .then((res) => {
        this.portfolioSubject.next({ balance: res.balance, stocks: res.stocks });
      })
      .catch(() => {
        // revert or ignore; keep optimistic update locally
        const symbol = stock.symbol;
        const updatedStocks = { ...current.stocks };
        updatedStocks[symbol] = (updatedStocks[symbol] || 0) + quantity;
        this.portfolioSubject.next({ balance: current.balance - cost, stocks: updatedStocks });
        this.applyPriceImpact(stock, 'buy', quantity);
      });

    return true;
  }

  sellStock(stockId: string, quantity: number): boolean {
    const stock = this.mockStocks.find((s) => s.id === stockId);
    if (!stock) return false;

    const current = this.portfolioSubject.value;
    const symbol = stock.symbol;
    const owned = current.stocks[symbol] || 0;
    if (owned < quantity) return false;

    const url = `${this.environment.apiBaseUrl}/api/portfolio/sell`;
    void firstValueFrom(this.http.post<{ balance: number; stocks: Record<string, number> }>(url, { stockId, quantity }))
      .then((res) => {
        this.portfolioSubject.next({ balance: res.balance, stocks: res.stocks });
      })
      .catch(() => {
        // optimistic local update if backend not available
        const proceeds = stock.price * quantity;
        const updatedStocks = { ...current.stocks };
        updatedStocks[symbol] = owned - quantity;
        if (updatedStocks[symbol] <= 0) delete updatedStocks[symbol];
        this.portfolioSubject.next({ balance: current.balance + proceeds, stocks: updatedStocks });
        this.applyPriceImpact(stock, 'sell', quantity);
      });

    return true;
  }

  private applyPriceImpact(stock: Stock, type: 'buy' | 'sell', quantity = 1): void {
    const prevPrice = stock.price;

    // Impact scales with quantity but with diminishing returns (sqrt), plus a small random factor.
    const qtyFactor = Math.sqrt(Math.max(1, quantity));
    const base = 0.5; // minimum base impact percent
    const impactPercent = Math.min(30, base + qtyFactor * 0.8 + Math.random() * Math.min(2, qtyFactor * 0.3));

    const factor = type === 'buy' ? 1 + impactPercent / 100 : 1 - impactPercent / 100;
    const newPrice = Math.round(prevPrice * factor * 100) / 100;

    // push new price to history and keep history length reasonable (retain more points)
    stock.priceHistory = [...stock.priceHistory, newPrice].slice(-250);

    // update stock change as percentage vs previous
    stock.change = Math.round(((newPrice - prevPrice) / prevPrice) * 100 * 100) / 100;
    stock.price = newPrice;
  }
}
