import type { OnInit, OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Portfolio, Stock } from './dashboard.service';
import { DashboardService } from './dashboard.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly cd = inject(ChangeDetectorRef);

  private pollSub?: Subscription;

  // Chart Configuration
  private readonly CHART_Height = 360; 
  private readonly CHART_BASELINE = 390; 
  private readonly CHART_LEFT_PAD = 40; 
  private readonly CHART_RIGHT_BOUND = 650; 
  private readonly VISIBLE_POINTS = 70; 

  indicator: { visible: boolean; type: 'buy' | 'sell' | null; active: boolean } = {
    visible: false,
    type: null,
    active: false,
  };

  stocks: Stock[] = [];
  selectedStock: Stock | null = null;
  portfolio: Portfolio | null = null;
  buyQuantity = 1;

  async ngOnInit(): Promise<void> {
    // Initialize data from backend (stocks and portfolio)
    await this.dashboardService.initializeData();
    this.stocks = this.dashboardService.getStocks();
    this.portfolio = this.dashboardService.getPortfolio();
    
    // Subscribe to portfolio changes
    this.dashboardService.portfolio$.subscribe((portfolio) => {
      this.portfolio = portfolio;
      this.cd.markForCheck();
    });

    // Poll every 5 seconds: ONLY refresh stocks data, NOT portfolio
    // Portfolio updates only when user explicitly buys/sells
    // Service now updates stocks in-place, so we don't replace the array
    this.pollSub = interval(5000).subscribe(async () => {
      try {
        await this.dashboardService.fetchStocksFromBackend();
        // No need to reassign this.stocks - service updates in-place
        // This keeps the same array reference, preventing list re-renders
        this.cd.markForCheck();
      } catch (e) {
        // ignore errors
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
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
          // Show indicator but don't refresh stocks - 2-sec poll will handle graph update
          this.showIndicator('buy');
        }
      }
    }
  }

  sellStock(stock: Stock): void {
    if (this.buyQuantity > 0 && this.portfolio) {
      const success = this.dashboardService.sellStock(stock.id, this.buyQuantity);
      if (success) {
        this.buyQuantity = 1;
        // Show indicator but don't refresh stocks - 2-sec poll will handle graph update
        this.showIndicator('sell');
      }
    }
  }

  private showIndicator(type: 'buy' | 'sell'): void {
    this.indicator.visible = true;
    this.indicator.type = type;
    this.indicator.active = false;
    this.cd.markForCheck();

    setTimeout(() => {
      this.indicator.active = true;
      this.cd.markForCheck();
    }, 40);

    setTimeout(() => {
      this.indicator.active = false;
      this.indicator.visible = false;
      this.indicator.type = null;
      this.cd.markForCheck();
    }, 1200);
  }

  openAddMoneyDialog(): void {
    const amount = prompt('Enter amount to add:', '1000');
    if (amount && !Number.isNaN(Number.parseFloat(amount))) {
      this.dashboardService.addMoney(Number.parseFloat(amount));
    }
  }

  private getVisibleHistory(priceHistory: number[]): number[] {
    return priceHistory.slice(-this.VISIBLE_POINTS);
  }

  /**
   * Compute Y ticks (price labels).
   */
  getYTicks(priceHistory: number[]): { y: number; label: string }[] {
    const prices = this.getVisibleHistory(priceHistory);
    if (prices.length === 0) return [];

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const buffer = (maxPrice - minPrice) * 0.05 || 0.1;
    const effectiveMin = minPrice - buffer;
    const effectiveMax = maxPrice + buffer;
    const range = effectiveMax - effectiveMin || 1;

    const ticks = 5;
    const step = range / (ticks - 1);

    const result: { y: number; label: string }[] = [];
    for (let i = 0; i < ticks; i++) {
      const price = effectiveMin + step * i;
      const y = this.CHART_BASELINE - ((price - effectiveMin) / range) * this.CHART_Height;
      result.push({ y, label: price.toFixed(2) });
    }
    return result;
  }

  /**
   * Compute X ticks (Time labels).
   * Generates static timestamps (HH:MM) based on data index, not real-time.
   */
  getXTicks(priceHistory: number[]): { x: number; label: string }[] {
    const prices = this.getVisibleHistory(priceHistory);
    const n = prices.length;
    if (n === 0) return [];

    const newestX = this.CHART_LEFT_PAD + (this.CHART_RIGHT_BOUND - this.CHART_LEFT_PAD) * 0.8;
    const availableWidth = newestX - this.CHART_LEFT_PAD;
    const candleWidth = availableWidth / Math.max(n, 1);

    const tickCount = 5;
    const result: { x: number; label: string }[] = [];
    // Use a fixed base time so times don't change on every refresh
    const baseTime = new Date(2024, 0, 1, 9, 30); // Fixed base: Jan 1, 2024 at 9:30 AM

    for (let i = 0; i < tickCount; i++) {
      const indexInSlice = Math.floor((i / (tickCount - 1)) * (n - 1));
      const offsetFromNewest = (n - 1) - indexInSlice;
      
      const x = newestX - (offsetFromNewest * candleWidth);
      
      // Calculate time based on fixed base time: each candle is ~1 minute apart
      const timeAtPoint = new Date(baseTime.getTime() + offsetFromNewest * 60000);
      const hours = timeAtPoint.getHours().toString().padStart(2, '0');
      const minutes = timeAtPoint.getMinutes().toString().padStart(2, '0');
      const label = `${hours}:${minutes}`;

      result.push({ x, label });
    }
    return result;
  }

  getCandles(priceHistory: number[]): any[] {
    if (!priceHistory || priceHistory.length === 0) return [];

    const prices = this.getVisibleHistory(priceHistory);
    const n = prices.length;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const buffer = (maxPrice - minPrice) * 0.05 || 0.1;
    const effectiveMin = minPrice - buffer;
    const effectiveMax = maxPrice + buffer;
    const range = effectiveMax - effectiveMin || 1;

    const activeAreaWidth = this.CHART_RIGHT_BOUND - this.CHART_LEFT_PAD;
    const newestX = this.CHART_LEFT_PAD + (activeAreaWidth * 0.8);
    const spaceForCandles = newestX - this.CHART_LEFT_PAD;
    const step = spaceForCandles / Math.max(n, 1);
    
    // UPDATED: Reduce width by half (0.5 factor) as requested
    const gap = 1.0; 
    const candleWidth = Math.max(1, (step - gap) * 0.5);

    const candles = [];

    for (let i = 0; i < n; i++) {
      const closePrice = prices[i];
      const openPrice = i > 0 ? prices[i - 1] : closePrice;
      const highPrice = Math.max(openPrice, closePrice);
      const lowPrice = Math.min(openPrice, closePrice);

      const offsetFromNewest = (n - 1) - i;
      const centerX = newestX - (offsetFromNewest * step) - (step / 2);

      const toY = (p: number) => this.CHART_BASELINE - ((p - effectiveMin) / range) * this.CHART_Height;

      const openY = toY(openPrice);
      const closeY = toY(closePrice);
      const highY = toY(highPrice);
      const lowY = toY(lowPrice);

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

      candles.push({
        x: centerX,
        highY,
        lowY,
        bodyY: bodyTop,
        bodyHeight,
        width: candleWidth,
        color: closePrice >= openPrice ? 'buy' : 'sell'
      });
    }

    return candles;
  }

  refreshStocks(selectedStockId?: string | number): void {
    const prevId = selectedStockId ?? this.selectedStock?.id;
    this.stocks = this.dashboardService.getStocks();
    if (prevId) {
      const updated = this.stocks.find((s) => s.id === prevId);
      if (updated) {
        this.selectedStock = updated;
      }
    }
  }

  canSell(): boolean {
    if (!this.portfolio || !this.selectedStock) return false;
    const owned = this.portfolio.stocks[this.selectedStock.symbol] || 0;
    return this.buyQuantity > 0 && owned > 0;
  }

  trackByStockId(_index: number, stock: Stock): string | number {
    return stock.id;
  }

  trackByPointIndex(index: number): number {
    return index;
  }
}
