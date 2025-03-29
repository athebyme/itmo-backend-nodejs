document.addEventListener('DOMContentLoaded', function() {
    // инициализируем sse для получения обновлений цен в реальном времени
    initPriceChangeNotifications();

    function initPriceChangeNotifications() {
        if (typeof EventSource === 'undefined') {
            console.error('ваш браузер не поддерживает server-sent events');
            return;
        }

        try {
            // подключаемся к sse эндпоинту
            const eventSource = new EventSource('/stats/price-changes-stream');

            eventSource.onopen = function() {
                console.log('sse соединение открыто');
                toastr.success('Соединение для обновлений цен установлено', 'Режим реального времени');
            };

            eventSource.addEventListener('message', function(event) {
                try {
                    const priceChange = JSON.parse(event.data);
                    showPriceChangeNotification(priceChange);

                    // если активна вкладка изменений цен, добавляем новую запись
                    if (document.getElementById('price-changes-tab').classList.contains('active')) {
                        addNewPriceChangeToTable(priceChange);
                    }
                } catch (error) {
                    console.error('ошибка обработки sse события:', error);
                }
            });

            eventSource.onerror = function(error) {
                console.error('sse ошибка:', error);

                // пробуем переподключиться через 5 секунд
                setTimeout(() => {
                    eventSource.close();
                    initPriceChangeNotifications();
                }, 5000);
            };

            // закрываем соединение при уходе со страницы
            window.addEventListener('beforeunload', function() {
                eventSource.close();
            });
        } catch (error) {
            console.error('ошибка при создании sse подключения:', error);
        }
    }

    // показывает уведомление при получении обновления о новом изменении цены
    function showPriceChangeNotification(priceChange) {
        // форматируем цены для уведомления
        const formattedOldPrice = `${priceChange.oldPrice} ₽`;
        const formattedNewPrice = `${priceChange.newPrice} ₽`;

        // выбираем тип уведомления в зависимости от направления изменения
        const notificationType = priceChange.changeAmount > 0 ? 'warning' : 'info';
        const changeDirection = priceChange.changeAmount > 0 ? 'повысилась' : 'снизилась';

        // показываем уведомление через toastr
        toastr[notificationType](
            `Цена товара "${priceChange.productName}" ${changeDirection} с ${formattedOldPrice} до ${formattedNewPrice} (${priceChange.changePercent.toFixed(1)}%)`,
            'Обновление цены'
        );
    }

    // добавляет новую запись в таблицу изменений цен
    function addNewPriceChangeToTable(priceChange) {
        const priceChangesTable = document.getElementById('priceChangesTable');
        if (!priceChangesTable) return;

        const tableBody = priceChangesTable.querySelector('tbody');

        // удаляем сообщение "нет данных" если оно есть
        if (tableBody.querySelector('td[colspan="7"]')) {
            tableBody.innerHTML = '';
        }

        // создаем новую строку
        const row = document.createElement('tr');
        row.className = 'highlight-new';

        // форматируем дату
        const date = new Date(priceChange.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        // создаем html для процентного изменения
        const percentBadge = priceChange.changePercent > 0
            ? `<span class="badge bg-success">+${priceChange.changePercent.toFixed(1)}%</span>`
            : `<span class="badge bg-danger">${priceChange.changePercent.toFixed(1)}%</span>`;

        // заполняем строку данными
        row.innerHTML = `
            <td>${priceChange.productName}</td>
            <td>${priceChange.vendorCode}</td>
            <td>${priceChange.oldPrice} ₽</td>
            <td>${priceChange.newPrice} ₽</td>
            <td>${priceChange.changeAmount} ₽</td>
            <td>${percentBadge}</td>
            <td>${formattedDate}</td>
        `;

        // добавляем строку в начало таблицы
        tableBody.insertBefore(row, tableBody.firstChild);

        // обновляем счетчики если они есть
        if (typeof priceState !== 'undefined' && priceState.items) {
            priceState.items.unshift(priceChange);
            priceState.totalCount = (priceState.totalCount || 0) + 1;

            // обновляем счетчики на странице
            const priceShownCount = document.getElementById('priceShownCount');
            const priceTotalCount = document.getElementById('priceTotalCount');

            if (priceShownCount) priceShownCount.textContent = priceState.items.length;
            if (priceTotalCount) priceTotalCount.textContent = priceState.totalCount;
        }
    }
});