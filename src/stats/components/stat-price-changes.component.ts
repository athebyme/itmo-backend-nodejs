import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { StatsService } from '../stats.service';
import { SSEService } from '../sse.service';
import { NotificationService } from '../notification.service';
import {
    PaginatedPriceChanges,
    PaginationQuery,
    PriceChange,
    PriceChangeFilter
} from '../stats.types';

@Component({
    selector: 'app-stats-price-changes',
    template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Изменения цен</h5>
        <div class="actions">
          <button 
            class="btn btn-sm btn-outline-secondary" 
            (click)="loadPriceChanges(true)"
            [disabled]="loading">
            <i class="bi bi-arrow-clockwise"></i> Обновить
          </button>
        </div>
      </div>
      <div class="card-body">
        <form [formGroup]="filterForm" class="mb-3">
          <div class="row g-2">
            <div class="col-md-3">
              <label class="form-label">Мин. изменение (%)</label>
              <input type="number" class="form-control" formControlName="minChangePercent">
            </div>
            <div class="col-md-3">
              <label class="form-label">Мин. изменение (₽)</label>
              <input type="number" class="form-control" formControlName="minChangeAmount">
            </div>
            <div class="col-md-3">
              <label class="form-label">С даты</label>
              <input type="date" class="form-control" formControlName="since">
            </div>
            <div class="col-md-3">
              <label class="form-label">&nbsp;</label>
              <div class="d-flex">
                <button type="button" class="btn btn-primary w-100" (click)="applyFilter()">
                  <i class="bi bi-filter"></i> Применить
                </button>
              </div>
            </div>
          </div>
        </form>

        <div class="table-responsive">
          <table id="priceChangesTable" class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Артикул</th>
                <th>Старая цена</th>
                <th>Новая цена</th>
                <th>Изменение (₽)</th>
                <th>Изменение (%)</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="7" class="text-center">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                  Загрузка данных...
                </td>
              </tr>
              <tr *ngIf="!loading && priceChanges.items.length === 0">
                <td colspan="7" class="text-center">
                  Нет данных об изменениях цен
                </td>
              </tr>
              <tr *ngFor="let change of priceChanges.items" [class.highlight-new]="change.isNew">
                <td>{{ change.productName }}</td>
                <td>{{ change.vendorCode }}</td>
                <td>{{ change.oldPrice }} ₽</td>
                <td>{{ change.newPrice }} ₽</td>
                <td>{{ change.changeAmount }} ₽</td>
                <td>
                  <span 
                    class="badge" 
                    [ngClass]="change.changePercent > 0 ? 'bg-success' : 'bg-danger'">
                    {{ (change.changePercent > 0 ? '+' : '') + change.changePercent.toFixed(1) }}%
                  </span>
                </td>
                <td>{{ formatDate(change.date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="pagination-info">
            Показано <span id="priceShownCount">{{ priceChanges.items.length }}</span> 
            из <span id="priceTotalCount">{{ priceChanges.totalCount }}</span>
          </div>
          <button 
            *ngIf="priceChanges.hasMore" 
            class="btn btn-sm btn-outline-primary" 
            (click)="loadMore()"
            [disabled]="loadingMore">
            <span *ngIf="loadingMore" class="spinner-border spinner-border-sm me-1" role="status"></span>
            Загрузить еще
          </button>
        </div>
      </div>
    </div>
  `
})
export class StatsPriceChangesComponent implements OnInit, OnDestroy {
    filterForm: FormGroup;
    priceChanges: PaginatedPriceChanges = {
        items: [],
        hasMore: false,
        totalCount: 0
    };
    loading = false;
    loadingMore = false;

    private nextCursor: string | null = null;
    private destroy$ = new Subject<void>();
    private ssePriceSubscription: Subscription | null = null;

    constructor(
        private statsService: StatsService,
        private sseService: SSEService,
        private notificationService: NotificationService,
        private fb: FormBuilder
    ) {
        this.filterForm = this.fb.group({
            minChangePercent: [5],
            minChangeAmount: [100],
            since: [this.getDefaultSinceDate()],
            onlyIncreases: [false],
            onlyDecreases: [false]
        });
    }

    ngOnInit(): void {
        // Слушаем изменения фильтров с задержкой
        this.filterForm.valueChanges
            .pipe(
                takeUntil(this.destroy$),
                debounceTime(500)
            )
            .subscribe(() => {
                // Можно раскомментировать для автоматического применения фильтра при изменении
                // this.applyFilter();
            });

        // Загружаем данные
        this.loadPriceChanges();

        // Подписываемся на SSE события изменения цен
        this.ssePriceSubscription = this.sseService.priceChanges$
            .pipe(takeUntil(this.destroy$))
            .subscribe(priceChange => {
                this.handlePriceChangeEvent(priceChange);
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        if (this.ssePriceSubscription) {
            this.ssePriceSubscription.unsubscribe();
        }
    }

    // Загрузка изменений цен
    loadPriceChanges(refresh: boolean = false): void {
        this.loading = true;
        this.nextCursor = null;

        const query: PaginationQuery = {
            limit: 20,
            refresh
        };

        const filter: PriceChangeFilter = this.getFilter();

        this.statsService.getPriceChanges(query, filter)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.priceChanges = data;
                    this.nextCursor = data.nextCursor || null;
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Ошибка при загрузке изменений цен:', error);
                    this.notificationService.showError('Не удалось загрузить изменения цен');
                    this.loading = false;
                }
            });
    }

    // Загрузка следующей страницы
    loadMore(): void {
        if (!this.nextCursor || this.loadingMore) return;

        this.loadingMore = true;

        const query: PaginationQuery = {
            limit: 20,
            cursor: this.nextCursor
        };

        const filter: PriceChangeFilter = this.getFilter();

        this.statsService.getPriceChanges(query, filter)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.priceChanges.items = [...this.priceChanges.items, ...data.items];
                    this.nextCursor = data.nextCursor || null;
                    this.priceChanges.hasMore = data.hasMore;
                    this.priceChanges.totalCount = data.totalCount;
                    this.loadingMore = false;
                },
                error: (error) => {
                    console.error('Ошибка при загрузке дополнительных изменений цен:', error);
                    this.notificationService.showError('Не удалось загрузить дополнительные данные');
                    this.loadingMore = false;
                }
            });
    }

    // Применить фильтр
    applyFilter(): void {
        this.loadPriceChanges();
    }

    // Получить текущий фильтр из формы
    private getFilter(): PriceChangeFilter {
        const formValues = this.filterForm.value;
        const filter: PriceChangeFilter = {};

        if (formValues.minChangePercent) {
            filter.minChangePercent = formValues.minChangePercent;
        }

        if (formValues.minChangeAmount) {
            filter.minChangeAmount = formValues.minChangeAmount;
        }

        if (formValues.since) {
            filter.since = formValues.since;
        }

        if (formValues.onlyIncreases) {
            filter.onlyIncreases = true;
        }

        if (formValues.onlyDecreases) {
            filter.onlyDecreases = true;
        }

        return filter;
    }

    // Получение даты по умолчанию (7 дней назад)
    private getDefaultSinceDate(): string {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    }

    // Форматирование даты для отображения
    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    // Обработка события изменения цены
    private handlePriceChangeEvent(priceChange: PriceChange): void {
        // Проверяем, соответствует ли изменение текущему фильтру
        const filter = this.getFilter();

        if (this.shouldDisplayPriceChange(priceChange, filter)) {
            // Добавляем флаг для подсветки новых элементов
            const enhancedChange = {
                ...priceChange,
                isNew: true
            };

            // Добавляем в начало списка
            this.priceChanges.items.unshift(enhancedChange);

            // Обновляем счетчики
            this.priceChanges.totalCount++;

            // Показываем уведомление
            this.notificationService.showPriceChangeNotification(priceChange);

            // Через 5 секунд убираем выделение нового элемента
            setTimeout(() => {
                const index = this.priceChanges.items.findIndex(item =>
                    item.productId === priceChange.productId &&
                    item.date === priceChange.date
                );

                if (index !== -1) {
                    this.priceChanges.items[index].isNew = false;
                }
            }, 5000);
        }
    }

    // Проверка соответствия изменения цены текущему фильтру
    private shouldDisplayPriceChange(priceChange: PriceChange, filter: PriceChangeFilter): boolean {
        if (filter.minChangePercent !== undefined &&
            Math.abs(priceChange.changePercent) < filter.minChangePercent) {
            return false;
        }

        if (filter.minChangeAmount !== undefined &&
            Math.abs(priceChange.changeAmount) < filter.minChangeAmount) {
            return false;
        }

        if (filter.onlyIncreases && priceChange.changePercent <= 0) {
            return false;
        }

        if (filter.onlyDecreases && priceChange.changePercent >= 0) {
            return false;
        }

        if (filter.since) {
            const filterDate = new Date(filter.since);
            const changeDate = new Date(priceChange.date);
            if (changeDate < filterDate) {
                return false;
            }
        }

        return true;
    }
}