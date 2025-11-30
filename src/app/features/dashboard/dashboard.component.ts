import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Portfolio, Stock } from './dashboard.service';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  stocks: Stock[] = [];
  selectedStock: Stock | null = null;
  portfolio: Portfolio | null = null;
  buyQuantity = 1;

  ngOnInit(): void {
    this.stocks = this.dashboardService.getStocks();
    this.portfolio = this.dashboardService.getPortfolio();
    this.dashboardService.portfolio$.subscribe((portfolio) => {
      this.portfolio = portfolio;
    });
  }

  selectStock(stock: Stock): void {
    this.selectedStock = stock;
    this.buyQuantity = 1;
  }

  buyStock(stock: Stock): void {
    if (this.buyQuantity > 0 && this.portfolio) {
      const cost = stock.price * this.buyQuantity;
      if (cost <= this.portfolio.balance) {
        const success = this.dashboardService.buyStock(stock.id, this.buyQuantity);
        if (success) {
          this.buyQuantity = 1;
        }
      }
    }
  }

  openAddMoneyDialog(): void {
    const amount = prompt('Enter amount to add:', '1000');
    if (amount && !Number.isNaN(Number.parseFloat(amount))) {
      this.dashboardService.addMoney(Number.parseFloat(amount));
    }
  }

  getChartPoints(priceHistory: number[]): string {
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const range = maxPrice - minPrice || 1;
    const width = 450;
    const height = 170;
    const xStep = width / (priceHistory.length - 1 || 1);

    return priceHistory
      .map((price, index) => {
        const xPos = 30 + index * xStep;
        const yPos = 180 - ((price - minPrice) / range) * height;
        return `${xPos},${yPos}`;
      })
      .join(' ');
  }

  getChartCoordinates(priceHistory: number[]): { x: number; y: number }[] {
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const range = maxPrice - minPrice || 1;
    const width = 450;
    const height = 170;
    const xStep = width / (priceHistory.length - 1 || 1);

    return priceHistory.map((price, index) => ({
      x: 30 + index * xStep,
      y: 180 - ((price - minPrice) / range) * height,
    })) as { x: number; y: number }[];
  }

  trackByStockId(_index: number, stock: Stock): string | number {
    return stock.id;
  }

  trackByPointIndex(index: number): number {
    return index;
  }
}
