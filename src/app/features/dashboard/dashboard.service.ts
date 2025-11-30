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
  
  private mockStocks: Stock[] = [];

  private portfolioSubject = new BehaviorSubject<Portfolio>({
    balance: 0,
    stocks: {},
  });

  portfolio$: Observable<Portfolio> = this.portfolioSubject.asObservable();

  /**
   * Fetch stocks and portfolio from backend on service initialization.
   * This is called once when the component initializes.
   */
  async initializeData(): Promise<void> {
    try {
      // Fetch stocks
      const stocksUrl = `${this.environment.apiBaseUrl}/api/stocks`;
      const stocks = await firstValueFrom(this.http.get<Stock[]>(stocksUrl));
      if (stocks && Array.isArray(stocks)) {
        this.mockStocks = stocks;
      }

      // Fetch portfolio for authenticated user
      const portfolioUrl = `${this.environment.apiBaseUrl}/api/stocks/portfolio`;
      const portfolio = await firstValueFrom(this.http.get<Portfolio>(portfolioUrl));
      if (portfolio) {
        this.portfolioSubject.next(portfolio);
      }
    } catch (error) {
      console.error('Failed to initialize data:', error);
      // Fallback to empty state
      this.mockStocks = [];
      this.portfolioSubject.next({ balance: 0, stocks: {} });
    }
  }

  getStocks(): Stock[] {
    return this.mockStocks;
  }

  /**
   * Fetch latest stocks from backend every 2 seconds.
   * This updates the stocks data but does NOT update portfolio automatically.
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
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    }
    // return current cached stocks on error
    return this.mockStocks;
  }

  /**
   * Fetch portfolio for authenticated user.
   * Call this to refresh portfolio after buy/sell operations.
   */
  async fetchPortfolioFromBackend(): Promise<Portfolio | null> {
    const url = `${this.environment.apiBaseUrl}/api/stocks/portfolio`;
    try {
      const result = await firstValueFrom(this.http.get<Portfolio>(url));
      if (result) {
        this.portfolioSubject.next(result);
        return result;
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
    return null;
  }

  getPortfolio(): Portfolio {
    return this.portfolioSubject.value;
  }

  addMoney(amount: number): void {
    const url = `${this.environment.apiBaseUrl}/api/stocks/portfolio/addMoney`;
    void firstValueFrom(this.http.post<Portfolio>(url, { amount }))
      .then((res) => {
        if (res) {
          this.portfolioSubject.next(res);
        }
      })
      .catch((error) => {
        console.error('Failed to add money:', error);
      });
  }

  buyStock(stockId: string, quantity: number): boolean {
    const stock = this.mockStocks.find((s) => s.id === stockId);
    if (!stock) return false;

    const cost = stock.price * quantity;
    const current = this.portfolioSubject.value;
    if (current.balance < cost) return false;

    const url = `${this.environment.apiBaseUrl}/api/stocks/portfolio/buy`;
    void firstValueFrom(this.http.post<Portfolio>(url, { stockId, quantity }))
      .then((res) => {
        if (res) {
          this.portfolioSubject.next(res);
        }
      })
      .catch((error) => {
        console.error('Failed to buy stock:', error);
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

    const url = `${this.environment.apiBaseUrl}/api/stocks/portfolio/sell`;
    void firstValueFrom(this.http.post<Portfolio>(url, { stockId, quantity }))
      .then((res) => {
        if (res) {
          this.portfolioSubject.next(res);
        }
      })
      .catch((error) => {
        console.error('Failed to sell stock:', error);
      });

    return true;
  }
}
