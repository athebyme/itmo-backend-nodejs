document.addEventListener('DOMContentLoaded', function() {
    // Debug helper function
    function debugSSE(message, data) {
        const debugEnabled = localStorage.getItem('enableSSEDebug') === 'true';
        if (debugEnabled) {
            console.log(`%cSSE Debug: ${message}`, 'color: #9c27b0; font-weight: bold;', data || '');

            // Add to debug panel if it exists
            const debugPanel = document.getElementById('sse-debug-panel');
            if (debugPanel) {
                const entry = document.createElement('div');
                entry.className = 'debug-entry';
                entry.innerHTML = `
                    <div class="debug-time">${new Date().toLocaleTimeString()}</div>
                    <div class="debug-message">${message}</div>
                    <div class="debug-data">${data ? JSON.stringify(data) : ''}</div>
                `;
                debugPanel.appendChild(entry);

                // Scroll to bottom
                debugPanel.scrollTop = debugPanel.scrollHeight;

                // Limit entries
                if (debugPanel.children.length > 100) {
                    debugPanel.removeChild(debugPanel.firstChild);
                }
            }
        }
    }

    // Toggle debug mode
    window.toggleSSEDebug = function() {
        const current = localStorage.getItem('enableSSEDebug') === 'true';
        localStorage.setItem('enableSSEDebug', (!current).toString());
        alert(`SSE Debug ${!current ? 'включен' : 'выключен'}`);
        location.reload();
    }

    // Create debug panel if debug is enabled
    if (localStorage.getItem('enableSSEDebug') === 'true') {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'sse-debug-panel';
        debugPanel.innerHTML = `
            <div class="debug-header">
                SSE Debug <button onclick="toggleSSEDebug()">Выключить</button>
                <button onclick="document.getElementById('sse-debug-panel').innerHTML = '<div class=\\'debug-header\\'>SSE Debug <button onclick=\\'toggleSSEDebug()\\'>Выключить</button><button onclick=\\'document.getElementById(\\\"sse-debug-panel\\\").innerHTML = \\\"\\\"\\'>Очистить</button></div>'">Очистить</button>
            </div>
        `;
        document.body.appendChild(debugPanel);

        // Add style
        const style = document.createElement('style');
        style.textContent = `
            #sse-debug-panel {
                position: fixed;
                bottom: 0;
                right: 0;
                width: 400px;
                height: 300px;
                background: rgba(0,0,0,0.8);
                color: #fff;
                z-index: 9999;
                font-family: monospace;
                font-size: 12px;
                overflow-y: auto;
                padding-bottom: 10px;
            }
            .debug-header {
                position: sticky;
                top: 0;
                background: #333;
                padding: 5px;
                border-bottom: 1px solid #666;
                display: flex;
                justify-content: space-between;
            }
            .debug-entry {
                padding: 5px;
                border-bottom: 1px solid #444;
            }
            .debug-time {
                color: #8bc34a;
                margin-bottom: 2px;
            }
            .debug-message {
                color: #03a9f4;
                margin-bottom: 2px;
            }
            .debug-data {
                color: #ff9800;
                word-break: break-all;
                white-space: pre-wrap;
            }
        `;
        document.head.appendChild(style);
    } else {
        // Add debug toggle button
        const btn = document.createElement('button');
        btn.textContent = 'Debug SSE';
        btn.style.position = 'fixed';
        btn.style.bottom = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '9999';
        btn.style.opacity = '0.7';
        btn.style.background = '#333';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.padding = '5px 10px';
        btn.onclick = window.toggleSSEDebug;
        document.body.appendChild(btn);
    }

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

        debugSSE(`SSE статус: ${status} - ${message}`);
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
            debugSSE('Подключение к SSE для обновлений цен');
            updateSSEStatus('connecting', 'Подключение...');

            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const eventSource = new EventSource(`/api/sse/price-changes?t=${timestamp}`);

            eventSource.onopen = function() {
                console.log('SSE соединение для цен открыто');
                debugSSE('SSE соединение для цен открыто');
                updateSSEStatus('connected', 'Соединение активно');

                toastr.success('Соединение для обновлений цен установлено', 'Режим реального времени');
                showConnectionMessage('Соединение для обновлений цен в реальном времени установлено');
            };

            // Handle connected event
            eventSource.addEventListener('connected', function(event) {
                console.log('SSE соединение установлено:', event.data);
                debugSSE('Получено событие connected', event.data);
            });

            // Handle price-change events
            eventSource.addEventListener('price-change', function(event) {
                try {
                    console.log('Получено SSE сообщение о цене:', event.data);
                    debugSSE('Получено событие price-change', event.data);
                    const priceChange = JSON.parse(event.data);
                    showPriceChangeNotification(priceChange);

                    if (document.getElementById('price-changes-tab')?.classList.contains('active') ||
                        !document.getElementById('price-changes-tab')) {
                        addNewPriceChangeToTable(priceChange);
                    }
                } catch (error) {
                    console.error('Ошибка обработки SSE события цены:', error);
                    debugSSE('Ошибка обработки события price-change', error.message);
                }
            });

            // Also handle default message event in case server doesn't specify event type
            eventSource.onmessage = function(event) {
                try {
                    console.log('Получено обычное SSE сообщение:', event.data);
                    debugSSE('Получено стандартное сообщение (onmessage)', event.data);
                    const data = JSON.parse(event.data);

                    // Determine event type from data
                    if (data && data.hasOwnProperty('oldPrice') && data.hasOwnProperty('newPrice')) {
                        // This looks like a price change
                        debugSSE('Стандартное сообщение определено как обновление цены', data);
                        showPriceChangeNotification(data);

                        if (document.getElementById('price-changes-tab')?.classList.contains('active') ||
                            !document.getElementById('price-changes-tab')) {
                            addNewPriceChangeToTable(data);
                        }
                    }
                } catch (error) {
                    console.error('Ошибка обработки SSE сообщения:', error);
                    debugSSE('Ошибка обработки стандартного сообщения', error.message);
                }
            };

            eventSource.onerror = function(error) {
                console.error('SSE ошибка для цен:', error);
                debugSSE('Ошибка SSE соединения для цен', error);
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
            debugSSE('Ошибка при создании SSE подключения для цен', error.message);
            updateSSEStatus('error', 'Ошибка подключения');
        }
    }

    // Connect to stock changes SSE
    function initStockChangeEvents() {
        try {
            console.log('Подключение к SSE для обновлений остатков...');
            debugSSE('Подключение к SSE для обновлений остатков');

            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const stockEventSource = new EventSource(`/api/sse/stock-changes?t=${timestamp}`);

            stockEventSource.onopen = function() {
                console.log('SSE соединение для остатков открыто');
                debugSSE('SSE соединение для остатков открыто');
                toastr.success('Соединение для обновлений остатков установлено', 'Режим реального времени');
            };

            // Handle stock-change events
            stockEventSource.addEventListener('stock-change', function(event) {
                try {
                    console.log('Получено SSE сообщение об остатках:', event.data);
                    debugSSE('Получено событие stock-change', event.data);
                    const stockChange = JSON.parse(event.data);
                    showStockChangeNotification(stockChange);

                    if (document.getElementById('stock-changes-tab')?.classList.contains('active') ||
                        (document.getElementById('stockChangesTable') && !document.getElementById('stock-changes-tab'))) {
                        addNewStockChangeToTable(stockChange);
                    }
                } catch (error) {
                    console.error('Ошибка обработки SSE события остатков:', error);
                    debugSSE('Ошибка обработки события stock-change', error.message);
                }
            });

            // Also handle default message event in case server doesn't specify event type
            stockEventSource.onmessage = function(event) {
                try {
                    console.log('Получено обычное SSE сообщение для остатков:', event.data);
                    debugSSE('Получено стандартное сообщение для остатков (onmessage)', event.data);
                    const data = JSON.parse(event.data);

                    // Determine if this is a stock change
                    if (data && data.hasOwnProperty('oldAmount') && data.hasOwnProperty('newAmount') && data.hasOwnProperty('warehouseId')) {
                        debugSSE('Стандартное сообщение определено как обновление остатков', data);
                        showStockChangeNotification(data);

                        if (document.getElementById('stock-changes-tab')?.classList.contains('active') ||
                            (document.getElementById('stockChangesTable') && !document.getElementById('stock-changes-tab'))) {
                            addNewStockChangeToTable(data);
                        }
                    }
                } catch (error) {
                    console.error('Ошибка обработки SSE сообщения для остатков:', error);
                    debugSSE('Ошибка обработки стандартного сообщения для остатков', error.message);
                }
            };

            stockEventSource.onerror = function(error) {
                console.error('SSE ошибка для остатков:', error);
                debugSSE('Ошибка SSE соединения для остатков', error);

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
            debugSSE('Ошибка при создании SSE подключения для остатков', error.message);
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

    // Show connection message in table
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