import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { PriceChange, SSEConnectionStatus, SSEEventType, SSEState, StockChange } from '/stats.types';

@Injectable({
    providedIn: 'root'
})
export class SSEService implements OnDestroy {
    // SSE Event Sources
    private priceEventSource: EventSource | null = null;
    private stockEventSource: EventSource | null = null;

    // Event subjects
    private priceChangeSubject = new Subject<PriceChange>();
    private stockChangeSubject = new Subject<StockChange>();

    // Connection state
    private sseStateSubject = new BehaviorSubject<SSEState>({
        status: SSEConnectionStatus.DISCONNECTED,
        statusMessage: 'Соединение не установлено',
        reconnectAttempts: 0
    });

    // Debug mode
    private debugMode = localStorage.getItem('enableSSEDebug') === 'true';

    constructor() {
        // Auto-connect on service initialization
        this.connectToSSE();
    }

    ngOnDestroy() {
        this.disconnectAll();
    }

    // Observable streams
    get priceChanges$(): Observable<PriceChange> {
        return this.priceChangeSubject.asObservable();
    }

    get stockChanges$(): Observable<StockChange> {
        return this.stockChangeSubject.asObservable();
    }

    get sseState$(): Observable<SSEState> {
        return this.sseStateSubject.asObservable();
    }

    // Connect to SSE endpoints
    connectToSSE() {
        this.updateSSEState({
            status: SSEConnectionStatus.CONNECTING,
            statusMessage: 'Подключение...',
            reconnectAttempts: 0
        });

        this.connectToPriceChanges();
        this.connectToStockChanges();
    }

    // Disconnect from all SSE endpoints
    disconnectAll() {
        this.debug('Отключение всех SSE соединений');

        if (this.priceEventSource) {
            this.priceEventSource.close();
            this.priceEventSource = null;
        }

        if (this.stockEventSource) {
            this.stockEventSource.close();
            this.stockEventSource = null;
        }

        this.updateSSEState({
            status: SSEConnectionStatus.DISCONNECTED,
            statusMessage: 'Соединение закрыто',
            reconnectAttempts: 0
        });
    }

    // Toggle SSE debug mode
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        localStorage.setItem('enableSSEDebug', this.debugMode.toString());
        return this.debugMode;
    }

    // Private methods
    private connectToPriceChanges() {
        if (this.priceEventSource) {
            this.priceEventSource.close();
        }

        try {
            const timestamp = new Date().getTime();
            this.priceEventSource = new EventSource(`/api/sse/price-changes?t=${timestamp}`) as EventSource;

            this.debug('Подключение к SSE для обновлений цен');

            // Handle connection open
            this.priceEventSource.onopen = () => {
                this.debug('SSE соединение для цен открыто');
                this.updateSSEState({
                    status: SSEConnectionStatus.CONNECTED,
                    statusMessage: 'Соединение активно',
                    lastEvent: new Date(),
                    reconnectAttempts: 0
                });
            };

            // Handle price change events
            this.priceEventSource.addEventListener(SSEEventType.PRICE_CHANGE, (event) => {
                try {
                    this.debug('Получено SSE событие price-change', event.data);
                    const priceChange = JSON.parse(event.data) as PriceChange;
                    this.priceChangeSubject.next(priceChange);
                } catch (error) {
                    this.debug('Ошибка обработки события price-change', error);
                }
            });

            // Handle generic messages (fallback)
            this.priceEventSource.onmessage = (event) => {
                try {
                    this.debug('Получено стандартное SSE сообщение', event.data);
                    const data = JSON.parse(event.data);

                    // Determine if this is a price change
                    if (data && data.hasOwnProperty('oldPrice') && data.hasOwnProperty('newPrice')) {
                        this.debug('Стандартное сообщение определено как обновление цены');
                        this.priceChangeSubject.next(data as PriceChange);
                    }
                } catch (error) {
                    this.debug('Ошибка обработки стандартного SSE сообщения', error);
                }
            };

            // Handle errors
            this.priceEventSource.onerror = (error) => {
                this.debug('SSE ошибка для цен', error);
                const currentState = this.sseStateSubject.value;

                this.updateSSEState({
                    status: SSEConnectionStatus.ERROR,
                    statusMessage: 'Ошибка соединения',
                    reconnectAttempts: currentState.reconnectAttempts + 1
                });

                // Attempt to reconnect
                setTimeout(() => {
                    if (this.priceEventSource) {
                        this.priceEventSource.close();
                        this.connectToPriceChanges();
                    }
                }, 5000);
            };
        } catch (error) {
            this.debug('Ошибка при создании SSE соединения для цен', error);
            this.updateSSEState({
                status: SSEConnectionStatus.ERROR,
                statusMessage: 'Ошибка подключения',
                reconnectAttempts: this.sseStateSubject.value.reconnectAttempts + 1
            });
        }
    }

    private connectToStockChanges() {
        if (this.stockEventSource) {
            this.stockEventSource.close();
        }

        try {
            const timestamp = new Date().getTime();
            this.stockEventSource = new EventSource(`/api/sse/stock-changes?t=${timestamp}`) as EventSource;

            this.debug('Подключение к SSE для обновлений остатков');

            // Handle connection open
            this.stockEventSource.onopen = () => {
                this.debug('SSE соединение для остатков открыто');
            };

            // Handle stock change events
            this.stockEventSource.addEventListener(SSEEventType.STOCK_CHANGE, (event) => {
                try {
                    this.debug('Получено SSE событие stock-change', event.data);
                    const stockChange = JSON.parse(event.data) as StockChange;
                    this.stockChangeSubject.next(stockChange);
                } catch (error) {
                    this.debug('Ошибка обработки события stock-change', error);
                }
            });

            // Handle generic messages (fallback)
            this.stockEventSource.onmessage = (event) => {
                try {
                    this.debug('Получено стандартное SSE сообщение для остатков', event.data);
                    const data = JSON.parse(event.data);

                    // Determine if this is a stock change
                    if (data && data.hasOwnProperty('oldAmount') && data.hasOwnProperty('newAmount') && data.hasOwnProperty('warehouseId')) {
                        this.debug('Стандартное сообщение определено как обновление остатков');
                        this.stockChangeSubject.next(data as StockChange);
                    }
                } catch (error) {
                    this.debug('Ошибка обработки стандартного SSE сообщения для остатков', error);
                }
            };

            // Handle errors
            this.stockEventSource.onerror = (error) => {
                this.debug('SSE ошибка для остатков', error);

                // Attempt to reconnect
                setTimeout(() => {
                    if (this.stockEventSource) {
                        this.stockEventSource.close();
                        this.connectToStockChanges();
                    }
                }, 5000);
            };
        } catch (error) {
            this.debug('Ошибка при создании SSE соединения для остатков', error);
        }
    }

    private updateSSEState(partialState: Partial<SSEState>) {
        this.sseStateSubject.next({
            ...this.sseStateSubject.value,
            ...partialState
        });
    }

    private debug(message: string, data?: any) {
        if (this.debugMode) {
            console.log(`%cSSE Debug: ${message}`, 'color: #9c27b0; font-weight: bold;', data || '');

            // Here you could also append to a debug panel in the UI if needed
        }
    }
}