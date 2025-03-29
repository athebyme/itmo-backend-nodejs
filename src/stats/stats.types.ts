
// Типы изменений цен
export interface PriceChange {
    productId: number;
    productName: string;
    vendorCode: string;
    oldPrice: number;
    newPrice: number;
    changeAmount: number;
    changePercent: number;
    date: string;
}

// Типы изменений остатков
export interface StockChange {
    productId: number;
    productName: string;
    vendorCode: string;
    warehouseId: number;
    warehouseName: string;
    oldAmount: number;
    newAmount: number;
    changeAmount: number;
    changePercent: number;
    date: string;
}

// Склады
export interface Warehouse {
    id: number;
    name: string;
}

// Общая статистика
export interface OverviewStats {
    totalProducts: number;
    totalWarehouses: number;
    avgPrice: number;
    totalStock: number;
    avgStock: number;
    lastUpdated: string;
    mostExpensiveItem: string;
    cheapestItem: string;
    lowStockItems: number;
    lowStockThreshold: number;
}

// Товары
export interface ProductStats {
    id: number;
    nmId: number;
    vendorCode: string;
    name: string;
    currentPrice: number;
    priceChange: number;
    totalStock: number;
    stockChange: number;
    lastUpdated: string;
}

// Данные для графика истории цен
export interface PriceHistoryItem {
    productId: number;
    date: string;
    price: number;
    discount: number;
    finalPrice: number;
}

// Данные для графика истории остатков
export interface StockHistoryItem {
    productId: number;
    warehouseId: number;
    date: string;
    amount: number;
}

// Параметры пагинации для запроса
export interface PaginationQuery {
    limit: number;
    cursor?: string;
    refresh?: boolean;
}

// Фильтры для изменений цен
export interface PriceChangeFilter {
    minChangePercent?: number;
    maxChangePercent?: number;
    minChangeAmount?: number;
    since?: string;
    onlyIncreases?: boolean;
    onlyDecreases?: boolean;
}

// Фильтры для изменений остатков
export interface StockChangeFilter {
    warehouseId?: number;
    minChangePercent?: number;
    minChangeAmount?: number;
    since?: string;
}

// Ответ с пагинацией для изменений цен
export interface PaginatedPriceChanges {
    items: PriceChange[];
    nextCursor?: string;
    hasMore: boolean;
    totalCount: number;
}

// Ответ с пагинацией для изменений остатков
export interface PaginatedStockChanges {
    items: StockChange[];
    nextCursor?: string;
    hasMore: boolean;
    totalCount: number;
}

// Данные для настроек страницы статистики
export interface StatsPageSettings {
    refreshInterval: number;
    defaultPriceFilter: PriceChangeFilter;
    defaultStockFilter: StockChangeFilter;
    enableSSE: boolean;
    maxNotifications: number;
}

// SSE События
export enum SSEEventType {
    PRICE_CHANGE = 'price-change',
    STOCK_CHANGE = 'stock-change',
    CONNECTED = 'connected',
    ERROR = 'error'
}

// Статус SSE соединения
export enum SSEConnectionStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
}

// Состояние SSE
export interface SSEState {
    status: SSEConnectionStatus;
    statusMessage: string;
    lastEvent?: Date;
    reconnectAttempts: number;
}