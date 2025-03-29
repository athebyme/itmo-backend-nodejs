document.addEventListener('DOMContentLoaded', function() {
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: '5000'
    };

    if (!localStorage.getItem('isLoggedIn')) {
        window.location.replace('./');
        return;
    }

    const sellerSelect = document.getElementById('sellerSelect');
    const refreshBtn = document.getElementById('refreshBtn');
    const apiStatus = document.getElementById('apiStatus');
    const apiError = document.getElementById('apiError');
    const errorMessage = document.getElementById('errorMessage');

    const priceChangesTable = document.getElementById('priceChangesTable');
    const priceLimitSelect = document.getElementById('priceLimitSelect');
    const priceMinChangePercent = document.getElementById('priceMinChangePercent');
    const priceMaxChangePercent = document.getElementById('priceMaxChangePercent');
    const priceMinChangeAmount = document.getElementById('priceMinChangeAmount');
    const priceSince = document.getElementById('priceSince');
    const onlyPriceIncreases = document.getElementById('onlyPriceIncreases');
    const onlyPriceDecreases = document.getElementById('onlyPriceDecreases');
    const priceFilterForm = document.getElementById('priceFilterForm');
    const priceLoadMore = document.getElementById('priceLoadMore');
    const priceShownCount = document.getElementById('priceShownCount');
    const priceTotalCount = document.getElementById('priceTotalCount');

    const stockChangesTable = document.getElementById('stockChangesTable');
    const stockLimitSelect = document.getElementById('stockLimitSelect');
    const warehouseFilter = document.getElementById('warehouseFilter');
    const stockMinChangePercent = document.getElementById('stockMinChangePercent');
    const stockMinChangeAmount = document.getElementById('stockMinChangeAmount');
    const stockSince = document.getElementById('stockSince');
    const stockFilterForm = document.getElementById('stockFilterForm');
    const stockLoadMore = document.getElementById('stockLoadMore');
    const stockShownCount = document.getElementById('stockShownCount');
    const stockTotalCount = document.getElementById('stockTotalCount');

    let currentSeller = new URLSearchParams(window.location.search).get('seller') || 'bananzza';
    sellerSelect.value = currentSeller;

    let priceState = {
        items: [],
        nextCursor: '',
        hasMore: false,
        totalCount: 0,
        filter: {}
    };

    let stockState = {
        items: [],
        nextCursor: '',
        hasMore: false,
        totalCount: 0,
        filter: {}
    };

    const getApiBaseUrl = () => `http://199.83.103.182/${currentSeller}`;

    const useApiOrMock = async (apiCall, mockDataFn) => {
        try {
            return await apiCall();
        } catch (error) {
            console.warn('API access failed, using mock data:', error);
            return mockDataFn();
        }
    };

    loadWarehouses();
    loadPriceChanges(true);

    sellerSelect.addEventListener('change', function() {
        currentSeller = this.value;
        window.history.replaceState(null, null, `?seller=${currentSeller}`);

        priceState = { items: [], nextCursor: '', hasMore: false, totalCount: 0, filter: {} };
        stockState = { items: [], nextCursor: '', hasMore: false, totalCount: 0, filter: {} };

        loadWarehouses();
        loadPriceChanges(true);

        if (document.getElementById('stock-changes-tab').classList.contains('active')) {
            loadStockChanges(true);
        }
    });

    refreshBtn.addEventListener('click', function() {
        const activeTab = document.querySelector('.tab-pane.active');

        if (activeTab.id === 'price-changes') {
            priceState = { items: [], nextCursor: '', hasMore: false, totalCount: 0, filter: priceState.filter };
            loadPriceChanges(true);
        } else {
            stockState = { items: [], nextCursor: '', hasMore: false, totalCount: 0, filter: stockState.filter };
            loadStockChanges(true);
        }
    });

    document.getElementById('price-changes-tab').addEventListener('shown.bs.tab', function() {
        if (priceState.items.length === 0) {
            loadPriceChanges(true);
        }
    });

    document.getElementById('stock-changes-tab').addEventListener('shown.bs.tab', function() {
        if (stockState.items.length === 0) {
            loadStockChanges(true);
        }
    });

    priceFilterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Price form submitted!");
        console.log("Form values:", {
            minPercent: priceMinChangePercent.value,
            maxPercent: priceMaxChangePercent.value,
            minAmount: priceMinChangeAmount.value,
            since: priceSince.value,
            onlyIncreases: onlyPriceIncreases.checked,
            onlyDecreases: onlyPriceDecreases.checked
        });
        applyPriceFilters(e);
    });

    stockFilterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Stock form submitted!");
        console.log("Form values:", {
            warehouseId: warehouseFilter.value,
            minPercent: stockMinChangePercent.value,
            minAmount: stockMinChangeAmount.value,
            since: stockSince.value
        });
        applyStockFilters(e);
    });

    priceLoadMore.addEventListener('click', function() {
        loadPriceChanges(false);
    });

    stockLoadMore.addEventListener('click', function() {
        loadStockChanges(false);
    });

    onlyPriceIncreases.addEventListener('change', function() {
        if (this.checked && onlyPriceDecreases.checked) {
            onlyPriceDecreases.checked = false;
        }
    });

    onlyPriceDecreases.addEventListener('change', function() {
        if (this.checked && onlyPriceIncreases.checked) {
            onlyPriceIncreases.checked = false;
        }
    });

    function applyPriceFilters(e) {
        if (e) e.preventDefault();

        // сбрасываем фильтр перед применением новых параметров
        priceState.filter = {};

        // минимальный процент изменения
        if (priceMinChangePercent.value && priceMinChangePercent.value !== "") {
            const percentValue = parseFloat(priceMinChangePercent.value);
            priceState.filter.minChangePercent = percentValue;
            console.log("Added minChangePercent:", percentValue, "Type:", typeof percentValue);
        }

        // максимальный процент изменения
        if (priceMaxChangePercent.value && priceMaxChangePercent.value !== "") {
            const percentValue = parseFloat(priceMaxChangePercent.value);
            priceState.filter.maxChangePercent = percentValue;
            console.log("Added maxChangePercent:", percentValue, "Type:", typeof percentValue);
        }

        // минимальная величина изменения
        if (priceMinChangeAmount.value && priceMinChangeAmount.value !== "") {
            const amountValue = parseInt(priceMinChangeAmount.value);
            priceState.filter.minChangeAmount = amountValue;
            console.log("Added minChangeAmount:", amountValue, "Type:", typeof amountValue);
        }

        // фильтр по дате
        if (priceSince.value && priceSince.value !== "") {
            priceState.filter.since = priceSince.value;
            console.log("Added since:", priceState.filter.since, "Type:", typeof priceState.filter.since);
        }

        // фильтры направления (повышения/понижения)
        if (onlyPriceIncreases.checked) {
            priceState.filter.onlyIncreases = true;
            console.log("Added onlyIncreases: true");
        }

        if (onlyPriceDecreases.checked) {
            priceState.filter.onlyDecreases = true;
            console.log("Added onlyDecreases: true");
        }

        console.log("Final filter object:", priceState.filter);

        // принудительная перезагрузка данных с новым фильтром
        loadPriceChanges(true);
    }

    function applyStockFilters(e) {
        if (e) e.preventDefault();

        console.log("Applying stock filters with values:");
        console.log("Warehouse:", warehouseFilter.value);
        console.log("Min % Change:", stockMinChangePercent.value);
        console.log("Min Amount Change:", stockMinChangeAmount.value);
        console.log("Since Date:", stockSince.value);

        loadStockChanges(true);
    }

    async function loadPriceChanges(reset = false) {
        showLoading();

        try {
            // проверка CORS чтобы избежать лишних preflight запросов
            try {
                const testRequest = new XMLHttpRequest();
                testRequest.open('OPTIONS', `${getApiBaseUrl()}/api/stats/price-changes`, false);
                testRequest.send();
            } catch (e) {
                console.warn('CORS error detected, using mock price data');
                loadMockPriceData();
                hideLoading();
                return;
            }

            const limit = parseInt(priceLimitSelect.value) || 20;

            // формируем тело запроса с правильной структурой
            const requestBody = {
                limit: limit,
                refresh: reset
            };

            // добавляем cursor если загружаем еще данные
            if (!reset && priceState.nextCursor) {
                requestBody.cursor = priceState.nextCursor;
            }

            // добавляем фильтр как вложенный объект если он не пустой
            if (Object.keys(priceState.filter).length > 0) {
                requestBody.filter = { ...priceState.filter };
            }

            console.log("Sending price changes request:", requestBody);

            const response = await fetch(`${getApiBaseUrl()}/api/stats/price-changes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const data = await response.json();
            console.log("API response:", data);

            // обновляем состояние
            if (reset) {
                priceState.items = data.items || [];
            } else {
                priceState.items = [...priceState.items, ...(data.items || [])];
            }

            priceState.nextCursor = data.nextCursor || '';
            priceState.hasMore = data.hasMore || false;
            priceState.totalCount = data.totalCount || 0;

            // обновляем интерфейс
            updatePriceChangesTable();
            updatePriceLoadMoreButton();
            updatePriceCounters();

            hideLoading();
        } catch (error) {
            console.error('Error loading price changes:', error);
            showError(`Ошибка при загрузке изменений цен: ${error.message}`);
            hideLoading();

            loadMockPriceData();
        }
    }

    async function loadStockChanges(reset = false) {
        showLoading();

        try {
            // проверка CORS чтобы избежать лишних preflight запросов
            try {
                const testRequest = new XMLHttpRequest();
                testRequest.open('OPTIONS', `${getApiBaseUrl()}/api/stats/stock-changes`, false);
                testRequest.send();
            } catch (e) {
                console.warn('CORS error detected, using mock stock data');
                loadMockStockData();
                hideLoading();
                return;
            }

            const limit = parseInt(stockLimitSelect.value) || 20;

            // формируем тело запроса как ожидает сервер
            const requestBody = {
                limit: limit
            };

            // добавляем refresh только если true
            if (reset) {
                requestBody.refresh = true;
            }

            // добавляем cursor если загружаем еще данные
            if (!reset && stockState.nextCursor) {
                requestBody.cursor = stockState.nextCursor;
            }

            // добавляем параметры фильтра напрямую в корень запроса

            // фильтр по складу
            if (warehouseFilter.value && warehouseFilter.value !== "") {
                const warehouseIdValue = parseInt(warehouseFilter.value);
                requestBody.warehouseId = warehouseIdValue;
                console.log("Added warehouseId:", warehouseIdValue, "Type:", typeof warehouseIdValue);
            }

            // минимальный процент изменения
            if (stockMinChangePercent.value && stockMinChangePercent.value !== "") {
                const percentValue = parseFloat(stockMinChangePercent.value);
                requestBody.minChangePercent = percentValue;
                console.log("Added minChangePercent:", percentValue, "Type:", typeof percentValue);
            }

            // минимальное количество изменения
            if (stockMinChangeAmount.value && stockMinChangeAmount.value !== "") {
                const amountValue = parseInt(stockMinChangeAmount.value);
                requestBody.minChangeAmount = amountValue;
                console.log("Added minChangeAmount:", amountValue, "Type:", typeof amountValue);
            }

            // фильтр по дате
            if (stockSince.value && stockSince.value !== "") {
                requestBody.since = stockSince.value;
                console.log("Added since:", requestBody.since, "Type:", typeof requestBody.since);
            }

            console.log("FINAL REQUEST:", JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${getApiBaseUrl()}/api/stats/stock-changes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const data = await response.json();
            console.log("API response:", data);

            if (reset) {
                // очищаем таблицу
                const tableBody = stockChangesTable.querySelector('tbody');
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Загрузка данных...</td></tr>';

                // обновляем состояние
                stockState.items = data.items || [];
            } else {
                stockState.items = [...stockState.items, ...(data.items || [])];
            }

            stockState.nextCursor = data.nextCursor || '';
            stockState.hasMore = data.hasMore || false;
            stockState.totalCount = data.totalCount || 0;

            // обновляем интерфейс
            updateStockChangesTable();
            updateStockLoadMoreButton();
            updateStockCounters();

            if (reset) {
                toastr.success('Фильтры применены');
            }

            hideLoading();
        } catch (error) {
            console.error('Error loading stock changes:', error);
            showError(`Ошибка при загрузке изменений остатков: ${error.message}`);
            hideLoading();

            loadMockStockData();
        }
    }

    async function loadWarehouses() {
        try {
            // проверка CORS
            const testRequest = new XMLHttpRequest();
            testRequest.open('GET', `${getApiBaseUrl()}/api/stats/warehouses`, false);
            try {
                testRequest.send();
            } catch (e) {
                console.warn('CORS error detected, using mock warehouse data');
                loadMockWarehouses();
                return;
            }

            const response = await fetch(`${getApiBaseUrl()}/api/stats/warehouses`);

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const warehouses = await response.json();

            // обновляем выпадающий список складов
            warehouseFilter.innerHTML = '<option value="">Все склады</option>';

            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                warehouseFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading warehouses:', error);
            loadMockWarehouses();
        }
    }

    function updatePriceChangesTable() {
        const tableBody = priceChangesTable.querySelector('tbody');

        // полностью очищаем таблицу перед обновлением
        tableBody.innerHTML = '';

        if (priceState.items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Нет данных</td></tr>';
            return;
        }

        // добавляем каждый элемент в таблицу
        priceState.items.forEach(change => {
            const row = document.createElement('tr');

            // форматируем дату в нужный формат
            const date = new Date(change.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

            const percentBadge = change.changePercent > 0
                ? `<span class="badge bg-success">+${change.changePercent.toFixed(1)}%</span>`
                : `<span class="badge bg-danger">${change.changePercent.toFixed(1)}%</span>`;

            row.innerHTML = `
                <td>${change.productName}</td>
                <td>${change.vendorCode}</td>
                <td>${change.oldPrice} ₽</td>
                <td>${change.newPrice} ₽</td>
                <td>${change.changeAmount} ₽</td>
                <td>${percentBadge}</td>
                <td>${formattedDate}</td>
            `;

            tableBody.appendChild(row);
        });

        // обновляем счетчики
        priceShownCount.textContent = priceState.items.length;
        priceTotalCount.textContent = priceState.totalCount;
    }

    function updateStockChangesTable() {
        const tableBody = stockChangesTable.querySelector('tbody');

        if (stockState.items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Нет данных</td></tr>';
            return;
        }

        if (tableBody.querySelector('td[colspan="8"]')) {
            tableBody.innerHTML = '';
        }

        stockState.items.forEach(change => {
            // пропускаем если эта строка уже существует
            const rowId = `stock-${change.productId}-${change.warehouseId}-${new Date(change.date).getTime()}`;
            if (tableBody.querySelector(`#${rowId}`)) {
                return;
            }

            const row = document.createElement('tr');
            row.id = rowId;

            // форматируем дату в нужный формат
            const date = new Date(change.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

            const percentBadge = change.changePercent > 0
                ? `<span class="badge bg-success">+${change.changePercent.toFixed(1)}%</span>`
                : `<span class="badge bg-danger">${change.changePercent.toFixed(1)}%</span>`;

            row.innerHTML = `
                <td>${change.productName}</td>
                <td>${change.vendorCode}</td>
                <td>${change.warehouseName}</td>
                <td>${change.oldAmount}</td>
                <td>${change.newAmount}</td>
                <td>${change.changeAmount > 0 ? '+' + change.changeAmount : change.changeAmount}</td>
                <td>${percentBadge}</td>
                <td>${formattedDate}</td>
            `;

            tableBody.appendChild(row);
        });

        // обновляем счетчики
        stockShownCount.textContent = stockState.items.length;
        stockTotalCount.textContent = stockState.totalCount;
    }

    function updatePriceLoadMoreButton() {
        priceLoadMore.disabled = !priceState.hasMore;
    }

    function updateStockLoadMoreButton() {
        stockLoadMore.disabled = !stockState.hasMore;
    }

    function updatePriceCounters() {
        priceShownCount.textContent = priceState.items.length;
        priceTotalCount.textContent = priceState.totalCount;
    }

    function updateStockCounters() {
        stockShownCount.textContent = stockState.items.length;
        stockTotalCount.textContent = stockState.totalCount;
    }

    function showLoading() {
        apiStatus.classList.remove('d-none');
        apiError.classList.add('d-none');
    }

    function hideLoading() {
        apiStatus.classList.add('d-none');
    }

    function showError(message) {
        apiError.classList.remove('d-none');
        errorMessage.textContent = message;
        toastr.error(message);
    }

    function formatCurrency(value) {
        return `${value} ₽`;
    }

    function formatNumber(value) {
        return new Intl.NumberFormat('ru-RU').format(value);
    }

    function formatNumberWithSign(value) {
        return (value > 0 ? '+' : '') + formatNumber(value);
    }

    function formatPercentage(value) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value / 100);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function getChangeBadge(percentage) {
        if (percentage > 0) {
            return `<span class="badge bg-success">+${percentage.toFixed(1)}%</span>`;
        } else if (percentage < 0) {
            return `<span class="badge bg-danger">${percentage.toFixed(1)}%</span>`;
        } else {
            return `<span class="badge bg-secondary">0%</span>`;
        }
    }

    function loadMockPriceData() {
        // демо-данные для цен
        const allMockItems = [
            {productId: 3784, productName: 'Натуральная массажная свеча Bougie Massage Candle 35 мл', vendorCode: 'id-27426-1366', oldPrice: 732, newPrice: 1065, changeAmount: 333, changePercent: 45.5, date: '2025-03-27T17:00:00Z'},
            {productId: 3785, productName: 'Массажная свеча с ароматом шоколада Bougie Massage Candle35', vendorCode: 'id-19549-1366', oldPrice: 749, newPrice: 1058, changeAmount: 309, changePercent: 41.3, date: '2025-03-27T17:00:00Z'},
            {productId: 3786, productName: 'Массажная свеча с ароматом кокоса Bougie Massage Candle 35мл', vendorCode: 'id-19543-1366', oldPrice: 758, newPrice: 1063, changeAmount: 305, changePercent: 40.2, date: '2025-03-27T17:00:00Z'},
            {productId: 3787, productName: 'Массажная свеча с ароматом мультифрукт Bougie MassageCandle', vendorCode: 'id-18147-1366', oldPrice: 1658, newPrice: 2286, changeAmount: 628, changePercent: 37.9, date: '2025-03-27T17:00:00Z'},
            {productId: 3788, productName: 'Светящийся в темноте Beyond by Toyfa', vendorCode: 'id-22754-1366', oldPrice: 1841, newPrice: 2530, changeAmount: 689, changePercent: 37.4, date: '2025-03-27T17:00:00Z'},
            {productId: 3789, productName: 'Автоматический мастурбатор PDX Elite Moto Bator X 5 режимов', vendorCode: 'id-25708-1366', oldPrice: 9009, newPrice: 11667, changeAmount: 2658, changePercent: 29.5, date: '2025-03-27T17:00:00Z'}
        ];

        // применяем фильтры к демо-данным
        let filteredItems = [...allMockItems];

        if (priceMinChangePercent.value) {
            const minPercent = parseFloat(priceMinChangePercent.value);
            filteredItems = filteredItems.filter(item => item.changePercent >= minPercent);
        }

        if (priceMaxChangePercent.value) {
            const maxPercent = parseFloat(priceMaxChangePercent.value);
            filteredItems = filteredItems.filter(item => item.changePercent <= maxPercent);
        }

        if (priceMinChangeAmount.value) {
            const minAmount = parseInt(priceMinChangeAmount.value);
            filteredItems = filteredItems.filter(item => item.changeAmount >= minAmount);
        }

        if (priceSince.value) {
            const sinceDate = new Date(priceSince.value);
            filteredItems = filteredItems.filter(item => new Date(item.date) >= sinceDate);
        }

        if (onlyPriceIncreases.checked) {
            filteredItems = filteredItems.filter(item => item.changeAmount > 0);
        }

        if (onlyPriceDecreases.checked) {
            filteredItems = filteredItems.filter(item => item.changeAmount < 0);
        }

        priceState.items = filteredItems;
        priceState.totalCount = filteredItems.length;
        priceState.hasMore = false;

        const tableBody = priceChangesTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Загрузка данных...</td></tr>';

        updatePriceChangesTable();
        updatePriceLoadMoreButton();
        updatePriceCounters();

        toastr.warning('Загружены демонстрационные данные из-за ограничений CORS');

        if (priceMinChangeAmount.value && priceMinChangeAmount.value >= 2000) {
            console.log('Applied minChangeAmount filter of ' + priceMinChangeAmount.value);
        }
    }

    function loadMockStockData() {
        // демо-данные для остатков
        const allMockItems = [
            {productId: 101, productName: 'Футболка спортивная', vendorCode: 'FS-001', warehouseId: 575679, warehouseName: 'X-sklad SPB', oldAmount: 245, newAmount: 230, changeAmount: -15, changePercent: -6.1, date: '2025-03-15T12:45:00'},
            {productId: 102, productName: 'Кроссовки беговые', vendorCode: 'KB-103', warehouseId: 575682, warehouseName: 'X-sklad MSK', oldAmount: 62, newAmount: 54, changeAmount: -8, changePercent: -12.9, date: '2025-03-14T10:30:00'},
            {productId: 103, productName: 'Куртка зимняя', vendorCode: 'KZ-201', warehouseId: 575679, warehouseName: 'X-sklad SPB', oldAmount: 25, newAmount: 32, changeAmount: 7, changePercent: 28.0, date: '2025-03-15T09:15:00'},
            {productId: 104, productName: 'Шапка вязаная', vendorCode: 'SV-050', warehouseId: 575682, warehouseName: 'X-sklad MSK', oldAmount: 106, newAmount: 120, changeAmount: 14, changePercent: 13.2, date: '2025-03-13T14:20:00'},
            {productId: 105, productName: 'Автоматический мастурбатор PDX Elite', vendorCode: 'AM-001', warehouseId: 575679, warehouseName: 'X-sklad SPB', oldAmount: 20, newAmount: 50, changeAmount: 30, changePercent: 150.0, date: '2025-03-27T17:00:00'}
        ];

        // применяем фильтры к демо-данным
        let filteredItems = [...allMockItems];

        if (warehouseFilter.value) {
            const warehouseId = parseInt(warehouseFilter.value);
            filteredItems = filteredItems.filter(item => item.warehouseId === warehouseId);
        }

        if (stockMinChangePercent.value) {
            const minPercent = parseFloat(stockMinChangePercent.value);
            filteredItems = filteredItems.filter(item => Math.abs(item.changePercent) >= minPercent);
        }

        if (stockMinChangeAmount.value) {
            const minAmount = parseInt(stockMinChangeAmount.value);
            filteredItems = filteredItems.filter(item => Math.abs(item.changeAmount) >= minAmount);
        }

        if (stockSince.value) {
            const sinceDate = new Date(stockSince.value);
            filteredItems = filteredItems.filter(item => new Date(item.date) >= sinceDate);
        }

        stockState.items = filteredItems;
        stockState.totalCount = filteredItems.length;
        stockState.hasMore = false;

        const tableBody = stockChangesTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Загрузка данных...</td></tr>';

        updateStockChangesTable();
        updateStockLoadMoreButton();
        updateStockCounters();

        toastr.warning('Загружены демонстрационные данные из-за ограничений CORS');
    }

    function loadMockWarehouses() {
        warehouseFilter.innerHTML = '<option value="">Все склады</option>';

        const mockWarehouses = [
            {id: 575679, name: 'X-sklad SPB'},
            {id: 575682, name: 'X-sklad MSK'}
        ];

        mockWarehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = warehouse.name;
            warehouseFilter.appendChild(option);
        });

        toastr.info('Загружены демонстрационные данные по складам');
    }
});