// Basic types for your NestJS backend
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

export interface PaginationQuery {
    limit: number;
    cursor?: string;
    refresh?: boolean;
}

export interface PriceChangeFilter {
    minChangePercent?: number;
    maxChangePercent?: number;
    minChangeAmount?: number;
    since?: string;
    onlyIncreases?: boolean;
    onlyDecreases?: boolean;
}

export interface PaginatedPriceChanges {
    items: PriceChange[];
    nextCursor?: string;
    hasMore: boolean;
    totalCount: number;
}