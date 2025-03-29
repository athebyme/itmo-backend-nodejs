document.addEventListener('DOMContentLoaded', function() {
    // Create SSE connection status indicator
    createSSEIndicator();

    // Start SSE connections
    setTimeout(() => {
        initSSEConnections();
    }, 1000);

    // Create visual indicator for SSE connection status
    function createSSEIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'sse-indicator';
        indicator.className = 'sse-indicator sse-connecting';
        indicator.innerHTML = `
            <span class="sse-status">Подключение...</span>
            <div class="sse-light"></div>
        `;

        const header = document.querySelector('.stats-header') || document.querySelector('.section.mb-4');
        if (header) {
            header.appendChild(indicator);
        } else {
            document.body.appendChild(indicator);
        }
    }

    // Update SSE connection status indicator
    function updateSSEStatus(status, message) {
        const indicator = document.getElementById('sse-indicator');
        if (!indicator) return;

        indicator.classList.remove('sse-connecting', 'sse-connected', 'sse-error');
        indicator.classList.add(`sse-${status}`);

        const statusText = indicator.querySelector('.sse-status');
        if (statusText) {
            statusText.textContent = message;
        }

        console.log(`SSE статус: ${status} - ${message}`);
    }

    // Initialize SSE connections for price and stock changes
    function initSSEConnections() {
        if (typeof EventSource === 'undefined') {
            console.error('Ваш браузер не поддерживает Server-Sent Events');
            updateSSEStatus('error', 'SSE не поддерживается браузером');
            return;
        }

        // Connect to price changes SSE endpoint
        initPriceChangeEvents();

        // Connect to stock changes SSE endpoint if on stock page
        if (document.getElementById('stockChangesTable')) {
            initStockChangeEvents();
        }
    }

    // Connect to price changes SSE
    function initPriceChangeEvents() {
        try {
            console.log('Подключение к SSE для обновлений цен...');
            updateSSEStatus('connecting', 'Подключение...');

            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const eventSource = new EventSource(`/api/sse/price-changes?t=${timestamp}`);

            eventSource.onopen = function() {
                console.log('SSE соединение для цен открыто');
                updateSSEStatus('connected', 'Соединение активно');

                toastr.success('Соединение для обновлений цен установлено', 'Режим реального времени');
                showConnectionMessage('Соединение для обновлений цен в реальном времени установлено');
            };

            // Handle connected event
            eventSource.addEventListener('connected', function(event) {
                console.log('SSE соединение установлено:', event.data);
            });

            // Handle price-change events
            eventSource.addEventListener('price-change', function(event) {
                try {
                    console.log('Получено SSE сообщение о цене:', event.data);
                    const priceChange = JSON.parse(event.data);
                    showPriceChangeNotification(priceChange);

                    if (document.getElementById('price-changes-tab')?.classList.contains('active')) {
                        addNewPriceChangeToTable(priceChange);
                    }
                } catch (error) {
                    console.error('Ошибка обработки SSE события цены:', error);
                }
            });

            eventSource.onerror = function(error) {
                console.error('SSE ошибка для цен:', error);
                updateSSEStatus('error', 'Ошибка соединения');

                setTimeout(() => {
                    eventSource.close();
                    initPriceChangeEvents();
                }, 5000);
            };

            window.addEventListener('beforeunload', function() {
                eventSource.close();
                console.log('SSE соединение закрыто');
            });
        } catch (error) {
            console.error('Ошибка при создании SSE подключения для цен:', error);
            updateSSEStatus('error', 'Ошибка подключения');
        }
    }

    // Connect to stock changes SSE
    function initStockChangeEvents() {
        try {
            console.log('Подключение к SSE для обновлений остатков...');

            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const stockEventSource = new EventSource(`/api/sse/stock-changes?t=${timestamp}`);

            stockEventSource.onopen = function() {
                console.log('SSE соединение для остатков открыто');
                toastr.success('Соединение для обновлений остатков установлено', 'Режим реального времени');
            };

            // Handle stock-change events
            stockEventSource.addEventListener('stock-change', function(event) {
                try {
                    console.log('Получено SSE сообщение об остатках:', event.data);
                    const stockChange = JSON.parse(event.data);
                    showStockChangeNotification(stockChange);

                    if (document.getElementById('stock-changes-tab')?.classList.contains('active')) {
                        addNewStockChangeToTable(stockChange);
                    }
                } catch (error) {
                    console.error('Ошибка обработки SSE события остатков:', error);
                }
            });

            stockEventSource.onerror = function(error) {
                console.error('SSE ошибка для остатков:', error);

                setTimeout(() => {
                    stockEventSource.close();
                    initStockChangeEvents();
                }, 5000);
            };

            window.addEventListener('beforeunload', function() {
                stockEventSource.close();
                console.log('SSE соединение для остатков закрыто');
            });
        } catch (error) {
            console.error('Ошибка при создании SSE подключения для остатков:', error);
        }
    }

    // Show notification for price change
    function showPriceChangeNotification(priceChange) {
        const formattedOldPrice = `${priceChange.oldPrice} ₽`;
        const formattedNewPrice = `${priceChange.newPrice} ₽`;

        const notificationType = priceChange.changeAmount > 0 ? 'warning' : 'info';
        const changeDirection = priceChange.changeAmount > 0 ? 'повысилась' : 'снизилась';

        toastr[notificationType](
            `Цена товара "${priceChange.productName}" ${changeDirection} с ${formattedOldPrice} до ${formattedNewPrice} (${priceChange.changePercent.toFixed(1)}%)`,
            'Обновление цены'
        );
    }

    // Show notification for stock change
    function showStockChangeNotification(stockChange) {
        const formattedOldAmount = `${stockChange.oldAmount} шт.`;
        const formattedNewAmount = `${stockChange.newAmount} шт.`;

        const notificationType = stockChange.changeAmount > 0 ? 'success' : 'warning';
        const changeDirection = stockChange.changeAmount > 0 ? 'увеличилось' : 'уменьшилось';

        toastr[notificationType](
            `Количество товара "${stockChange.productName}" на складе "${stockChange.warehouseName}" ${changeDirection} с ${formattedOldAmount} до ${formattedNewAmount} (${Math.abs(stockChange.changePercent).toFixed(1)}%)`,
            'Обновление остатков'
        );
    }

    // Add new price change to prices table
    function addNewPriceChangeToTable(priceChange) {
        const priceChangesTable = document.getElementById('priceChangesTable');
        if (!priceChangesTable) return;

        const tableBody = priceChangesTable.querySelector('tbody');
        if (!tableBody) return;

        // Remove message row if exists
        const messageRow = tableBody.querySelector('.sse-message-row');
        if (messageRow) {
            tableBody.removeChild(messageRow);
        }

        // Create new row
        const row = document.createElement('tr');
        row.className = 'highlight-new';

        // Format date
        const date = new Date(priceChange.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        // Create badge for percentage
        const percentBadge = priceChange.changePercent > 0
            ? `<span class="badge bg-success">+${priceChange.changePercent.toFixed(1)}%</span>`
            : `<span class="badge bg-danger">${priceChange.changePercent.toFixed(1)}%</span>`;

        // Set row HTML
        row.innerHTML = `
            <td>${priceChange.productName}</td>
            <td>${priceChange.vendorCode}</td>
            <td>${priceChange.oldPrice} ₽</td>
            <td>${priceChange.newPrice} ₽</td>
            <td>${priceChange.changeAmount} ₽</td>
            <td>${percentBadge}</td>
            <td>${formattedDate}</td>
        `;

        // Add row to table
        tableBody.insertBefore(row, tableBody.firstChild);

        // Update counts if they exist
        if (typeof priceState !== 'undefined' && priceState.items) {
            priceState.items.unshift(priceChange);
            priceState.totalCount = (priceState.totalCount || 0) + 1;

            const priceShownCount = document.getElementById('priceShownCount');
            const priceTotalCount = document.getElementById('priceTotalCount');

            if (priceShownCount) priceShownCount.textContent = priceState.items.length;
            if (priceTotalCount) priceTotalCount.textContent = priceState.totalCount;
        }
    }

    // Add new stock change to stocks table
    function addNewStockChangeToTable(stockChange) {
        const stockChangesTable = document.getElementById('stockChangesTable');
        if (!stockChangesTable) return;

        const tableBody = stockChangesTable.querySelector('tbody');
        if (!tableBody) return;

        // Create new row
        const row = document.createElement('tr');
        row.className = 'highlight-new';

        // Format date
        const date = new Date(stockChange.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        // Create badge for percentage
        const percentBadge = stockChange.changeAmount > 0
            ? `<span class="badge bg-success">+${Math.abs(stockChange.changePercent).toFixed(1)}%</span>`
            : `<span class="badge bg-danger">-${Math.abs(stockChange.changePercent).toFixed(1)}%</span>`;

        // Set row HTML
        row.innerHTML = `
            <td>${stockChange.productName}</td>
            <td>${stockChange.vendorCode}</td>
            <td>${stockChange.warehouseName}</td>
            <td>${stockChange.oldAmount}</td>
            <td>${stockChange.newAmount}</td>
            <td>${stockChange.changeAmount}</td>
            <td>${percentBadge}</td>
            <td>${formattedDate}</td>
        `;

        // Add row to table
        tableBody.insertBefore(row, tableBody.firstChild);

        // Update counts if they exist
        if (typeof stockState !== 'undefined' && stockState.items) {
            stockState.items.unshift(stockChange);
            stockState.totalCount = (stockState.totalCount || 0) + 1;

            const stockShownCount = document.getElementById('stockShownCount');
            const stockTotalCount = document.getElementById('stockTotalCount');

            if (stockShownCount) stockShownCount.textContent = stockState.items.length;
            if (stockTotalCount) stockTotalCount.textContent = stockState.totalCount;
        }
    }

    function showConnectionMessage(message) {
        const priceChangesTable = document.getElementById('priceChangesTable');
        if (!priceChangesTable) return;

        const tableBody = priceChangesTable.querySelector('tbody');
        if (!tableBody) return;

        const loadingRow = tableBody.querySelector('td[colspan="7"]');
        if (loadingRow) {
            loadingRow.innerHTML = `<div class="sse-connected-message">${message}</div>`;
            return;
        }

        const messageRow = document.createElement('tr');
        messageRow.className = 'sse-message-row';
        messageRow.innerHTML = `
            <td colspan="7" class="text-center">
                <div class="sse-connected-message">${message}</div>
            </td>
        `;

        tableBody.insertBefore(messageRow, tableBody.firstChild);
    }
});