// Price change related types
export interface PriceChange {
    productId: number;
    productName: string;
    vendorCode: string;
    oldPrice: number;
    newPrice: number;
    changeAmount: number;
    changePercent: number;
    date: string;
    isNew?: boolean;
}

// Stock change related types
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

// Pagination query parameters
export interface PaginationQuery {
    limit?: number;
    cursor?: string;
    refresh?: boolean;
}

// Filters for price changes
export interface PriceChangeFilter {
    minChangePercent?: number;
    maxChangePercent?: number;
    minChangeAmount?: number;
    since?: string;
    onlyIncreases?: boolean;
    onlyDecreases?: boolean;
}

// Filters for stock changes
export interface StockChangeFilter {
    warehouseId?: number;
    minChangePercent?: number;
    minChangeAmount?: number;
    since?: string;
}

// Paginated response for price changes
export interface PaginatedPriceChanges {
    items: PriceChange[];
    nextCursor?: string;
    hasMore: boolean;
    totalCount: number;
}

// Paginated response for stock changes
export interface PaginatedStockChanges {
    items: StockChange[];
    nextCursor?: string;
    hasMore: boolean;
    totalCount: number;
}