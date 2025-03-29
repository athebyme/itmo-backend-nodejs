document.addEventListener('DOMContentLoaded', function() {
    createSSEIndicator();

    setTimeout(() => {
        initPriceChangeNotifications();
    }, 1000);

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

    function initPriceChangeNotifications() {
        if (typeof EventSource === 'undefined') {
            console.error('ваш браузер не поддерживает server-sent events');
            updateSSEStatus('error', 'SSE не поддерживается браузером');
            return;
        }

        try {
            console.log('пытаюсь подключиться к SSE');
            updateSSEStatus('connecting', 'Подключение...');

            // добавляю метку времени против кэширования
            const timestamp = new Date().getTime();
            const eventSource = new EventSource(`/stats/price-changes-stream?t=${timestamp}`);

            eventSource.onopen = function() {
                console.log('sse соединение открыто');
                updateSSEStatus('connected', 'Соединение активно');

                toastr.success('Соединение для обновлений цен установлено', 'Режим реального времени');
                showConnectionMessage('Соединение для обновлений цен в реальном времени установлено');
            };

            eventSource.addEventListener('message', function(event) {
                try {
                    console.log('Получено SSE сообщение:', event.data);
                    const priceChange = JSON.parse(event.data);
                    showPriceChangeNotification(priceChange);

                    if (document.getElementById('price-changes-tab').classList.contains('active')) {
                        addNewPriceChangeToTable(priceChange);
                    }
                } catch (error) {
                    console.error('ошибка обработки sse события:', error);
                }
            });

            eventSource.onerror = function(error) {
                console.error('sse ошибка:', error);
                updateSSEStatus('error', 'Ошибка соединения');

                setTimeout(() => {
                    eventSource.close();
                    initPriceChangeNotifications();
                }, 5000);
            };

            window.addEventListener('beforeunload', function() {
                eventSource.close();
                console.log('sse соединение закрыто');
            });
        } catch (error) {
            console.error('ошибка при создании sse подключения:', error);
            updateSSEStatus('error', 'Ошибка подключения');
        }
    }

    function showConnectionMessage(message) {
        const priceChangesTable = document.getElementById('priceChangesTable');
        if (!priceChangesTable) return;

        const tableBody = priceChangesTable.querySelector('tbody');

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

    function addNewPriceChangeToTable(priceChange) {
        const priceChangesTable = document.getElementById('priceChangesTable');
        if (!priceChangesTable) return;

        const tableBody = priceChangesTable.querySelector('tbody');

        const messageRow = tableBody.querySelector('.sse-message-row');
        if (messageRow) {
            tableBody.removeChild(messageRow);
        }

        const row = document.createElement('tr');
        row.className = 'highlight-new';

        const date = new Date(priceChange.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        const percentBadge = priceChange.changePercent > 0
            ? `<span class="badge bg-success">+${priceChange.changePercent.toFixed(1)}%</span>`
            : `<span class="badge bg-danger">${priceChange.changePercent.toFixed(1)}%</span>`;

        row.innerHTML = `
            <td>${priceChange.productName}</td>
            <td>${priceChange.vendorCode}</td>
            <td>${priceChange.oldPrice} ₽</td>
            <td>${priceChange.newPrice} ₽</td>
            <td>${priceChange.changeAmount} ₽</td>
            <td>${percentBadge}</td>
            <td>${formattedDate}</td>
        `;

        tableBody.insertBefore(row, tableBody.firstChild);

        // обновляю счетчики если они существуют
        if (typeof priceState !== 'undefined' && priceState.items) {
            priceState.items.unshift(priceChange);
            priceState.totalCount = (priceState.totalCount || 0) + 1;

            const priceShownCount = document.getElementById('priceShownCount');
            const priceTotalCount = document.getElementById('priceTotalCount');

            if (priceShownCount) priceShownCount.textContent = priceState.items.length;
            if (priceTotalCount) priceTotalCount.textContent = priceState.totalCount;
        }
    }
});