import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbLayoutModule,
  NbCardModule,
  NbButtonModule,
  NbIconModule,
  NbListModule,
  NbThemeModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { DashboardService, Stock, Portfolio } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NbLayoutModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbListModule,
    NbThemeModule,
    NbEvaIconsModule,
  ],
  providers: [NbThemeModule.forRoot({ name: 'default' }).providers || []],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

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
    if (amount && !isNaN(parseFloat(amount))) {
      this.dashboardService.addMoney(parseFloat(amount));
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
      .map((price, i) => {
        const x = 30 + i * xStep;
        const y = 180 - ((price - minPrice) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }

  getChartCoordinates(priceHistory: number[]): Array<{ x: number; y: number }> {
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const range = maxPrice - minPrice || 1;
    const width = 450;
    const height = 170;
    const xStep = width / (priceHistory.length - 1 || 1);

    return priceHistory.map((price, i) => ({
      x: 30 + i * xStep,
      y: 180 - ((price - minPrice) / range) * height,
    }));
  }
}
