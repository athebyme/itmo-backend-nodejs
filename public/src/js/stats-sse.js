// SSE client for connecting to server-sent events
document.addEventListener('DOMContentLoaded', function() {
    // Initialize toastr notification settings
    toastr.options = {
        closeButton: true,
        newestOnTop: true,
        progressBar: true,
        positionClass: "toast-top-right",
        preventDuplicates: false,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "7000",
        extendedTimeOut: "1000"
    };

    // Update connection status indicator
    const statusElement = document.querySelector('.sse-status');
    if (statusElement) {
        statusElement.textContent = 'Подключение...';
        statusElement.className = 'sse-status sse-status-connecting';
    }

    // Connect to price changes SSE endpoint
    const priceEventsSource = new EventSource('/api/sse/price-changes');

    priceEventsSource.addEventListener('open', function() {
        console.log('Connected to price changes SSE');
        updateConnectionStatus('connected');
    });

    priceEventsSource.addEventListener('price-change', function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Price change event received:', data);

            // Display notification
            showPriceChangeNotification(data);
        } catch (error) {
            console.error('Error processing price change event:', error);
        }
    });

    // Connect to stock changes SSE endpoint
    const stockEventsSource = new EventSource('/api/sse/stock-changes');

    stockEventsSource.addEventListener('open', function() {
        console.log('Connected to stock changes SSE');
    });

    stockEventsSource.addEventListener('stock-change', function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Stock change event received:', data);

            // Display notification
            showStockChangeNotification(data);
        } catch (error) {
            console.error('Error processing stock change event:', error);
        }
    });

    // Error handling for SSE connections
    priceEventsSource.onerror = function(error) {
        console.error('Error in price changes SSE connection:', error);
        updateConnectionStatus('disconnected');
    };

    stockEventsSource.onerror = function(error) {
        console.error('Error in stock changes SSE connection:', error);
    };

    // Functions to show notifications
    function showPriceChangeNotification(priceChange) {
        const isIncrease = priceChange.changePercent > 0;
        const absChangePercent = Math.abs(priceChange.changePercent).toFixed(1);

        const title = isIncrease
            ? `⬆️ Цена повысилась на ${absChangePercent}%`
            : `⬇️ Цена снизилась на ${absChangePercent}%`;

        const message = `${priceChange.productName}<br>
                         ${priceChange.oldPrice} ₽ → ${priceChange.newPrice} ₽<br>
                         Артикул: ${priceChange.vendorCode}`;

        if (isIncrease) {
            toastr.warning(message, title);
        } else {
            toastr.info(message, title);
        }
    }

    function showStockChangeNotification(stockChange) {
        const isIncrease = stockChange.changePercent > 0;
        const absChangePercent = Math.abs(stockChange.changePercent).toFixed(1);

        const title = isIncrease
            ? `📦 Поступление товара +${absChangePercent}%`
            : `⚠️ Уменьшение остатков -${absChangePercent}%`;

        const message = `${stockChange.productName}<br>
                         ${stockChange.oldAmount} шт. → ${stockChange.newAmount} шт.<br>
                         Склад: ${stockChange.warehouseName}<br>
                         Артикул: ${stockChange.vendorCode}`;

        if (isIncrease) {
            toastr.success(message, title);
        } else {
            if (stockChange.newAmount === 0) {
                toastr.error(message, '❗ Товар закончился на складе');
            } else {
                toastr.warning(message, title);
            }
        }
    }

    function updateConnectionStatus(status) {
        const statusElement = document.querySelector('.sse-status');
        if (!statusElement) return;

        if (status === 'connected') {
            statusElement.textContent = 'Подключено';
            statusElement.className = 'sse-status sse-status-connected';
        } else if (status === 'disconnected') {
            statusElement.textContent = 'Отключено';
            statusElement.className = 'sse-status sse-status-disconnected';
        } else {
            statusElement.textContent = 'Подключение...';
            statusElement.className = 'sse-status sse-status-connecting';
        }
    }
});