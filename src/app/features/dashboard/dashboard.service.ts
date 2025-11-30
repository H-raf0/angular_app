import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

  getPortfolio(): Portfolio {
    return this.portfolioSubject.value;
  }

  addMoney(amount: number): void {
    const current = this.portfolioSubject.value;
    this.portfolioSubject.next({
      ...current,
      balance: current.balance + amount,
    });
  }

  buyStock(stockId: string, quantity: number): boolean {
    const stock = this.mockStocks.find((s) => s.id === stockId);
    if (!stock) return false;

    const cost = stock.price * quantity;
    const current = this.portfolioSubject.value;

    if (current.balance < cost) return false;

    const symbol = stock.symbol;
    const updatedStocks = { ...current.stocks };
    updatedStocks[symbol] = (updatedStocks[symbol] || 0) + quantity;

    this.portfolioSubject.next({
      balance: current.balance - cost,
      stocks: updatedStocks,
    });

    return true;
  }
}
