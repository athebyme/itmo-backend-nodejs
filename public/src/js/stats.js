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
        applyPriceFilters();
    });

    stockFilterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        applyStockFilters();
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

    function applyPriceFilters() {
        const filter = {};

        if (priceMinChangePercent.value) {
            filter.minChangePercent = parseFloat(priceMinChangePercent.value);
        }

        if (priceMaxChangePercent.value) {
            filter.maxChangePercent = parseFloat(priceMaxChangePercent.value);
        }

        if (priceMinChangeAmount.value) {
            filter.minChangeAmount = parseInt(priceMinChangeAmount.value);
        }

        if (priceSince.value) {
            filter.since = new Date(priceSince.value).toISOString();
        }

        if (onlyPriceIncreases.checked) {
            filter.onlyIncreases = true;
        }

        if (onlyPriceDecreases.checked) {
            filter.onlyDecreases = true;
        }

        console.log("Applying price filters:", filter);

        priceState = {
            items: [],
            nextCursor: '',
            hasMore: false,
            totalCount: 0,
            filter: filter
        };

        loadPriceChanges(true);
    }

    function applyStockFilters() {
        const filter = {};

        if (warehouseFilter.value) {
            filter.warehouseId = parseInt(warehouseFilter.value);
        }

        if (stockMinChangePercent.value) {
            filter.minChangePercent = parseFloat(stockMinChangePercent.value);
        }

        if (stockMinChangeAmount.value) {
            filter.minChangeAmount = parseInt(stockMinChangeAmount.value);
        }

        if (stockSince.value) {
            filter.since = new Date(stockSince.value).toISOString();
        }

        stockState = {
            items: [],
            nextCursor: '',
            hasMore: false,
            totalCount: 0,
            filter: filter
        };

        loadStockChanges(true);
    }

    async function loadPriceChanges(reset = false) {
        showLoading();

        try {
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

            const requestBody = {
                limit: limit,
                refresh: reset
            };

            if (Object.keys(priceState.filter).length > 0) {
                requestBody.filter = priceState.filter;
            }

            console.log("Sending price changes request:", requestBody);

            if (!reset && priceState.nextCursor) {
                requestBody.cursor = priceState.nextCursor;
            }

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

            if (reset) {
                priceState.items = data.items || [];
            } else {
                priceState.items = [...priceState.items, ...(data.items || [])];
            }

            priceState.nextCursor = data.nextCursor || '';
            priceState.hasMore = data.hasMore || false;
            priceState.totalCount = data.totalCount || 0;

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

            const requestBody = {
                limit: limit,
                refresh: reset
            };

            if (!reset && stockState.nextCursor) {
                requestBody.cursor = stockState.nextCursor;
            }

            if (stockState.filter.warehouseId !== undefined) {
                requestBody.warehouseId = stockState.filter.warehouseId;
            }

            if (stockState.filter.minChangePercent !== undefined) {
                requestBody.minChangePercent = stockState.filter.minChangePercent;
            }

            if (stockState.filter.minChangeAmount !== undefined) {
                requestBody.minChangeAmount = stockState.filter.minChangeAmount;
            }

            if (stockState.filter.since !== undefined) {
                requestBody.since = stockState.filter.since;
            }

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

            if (reset) {
                stockState.items = data.items || [];
            } else {
                stockState.items = [...stockState.items, ...(data.items || [])];
            }

            stockState.nextCursor = data.nextCursor || '';
            stockState.hasMore = data.hasMore || false;
            stockState.totalCount = data.totalCount || 0;

            updateStockChangesTable();
            updateStockLoadMoreButton();
            updateStockCounters();

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

        if (priceState.items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Нет данных</td></tr>';
            return;
        }

        if (tableBody.querySelector('td[colspan="7"]')) {
            tableBody.innerHTML = '';
        }

        priceState.items.forEach(change => {
            const rowId = `price-${change.productId}-${new Date(change.date).getTime()}`;
            if (tableBody.querySelector(`#${rowId}`)) {
                return;
            }

            const row = document.createElement('tr');
            row.id = rowId;

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
            const rowId = `stock-${change.productId}-${change.warehouseId}-${new Date(change.date).getTime()}`;
            if (tableBody.querySelector(`#${rowId}`)) {
                return;
            }

            const row = document.createElement('tr');
            row.id = rowId;

            row.innerHTML = `
                <td>${change.productName}</td>
                <td>${change.vendorCode}</td>
                <td>${change.warehouseName}</td>
                <td>${formatNumber(change.oldAmount)}</td>
                <td>${formatNumber(change.newAmount)}</td>
                <td>${formatNumberWithSign(change.changeAmount)}</td>
                <td>${getChangeBadge(change.changePercent)}</td>
                <td>${formatDate(change.date)}</td>
            `;

            tableBody.appendChild(row);
        });
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

    function formatNumber(value) {
        return new Intl.NumberFormat('ru-RU').format(value);
    }

    function formatNumberWithSign(value) {
        return (value > 0 ? '+' : '') + formatNumber(value);
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
        priceState.items = [
            {productId: 3784, productName: 'Натуральная массажная свеча Bougie Massage Candle 35 мл', vendorCode: 'id-27426-1366', oldPrice: 732, newPrice: 1065, changeAmount: 333, changePercent: 45.5, date: '2025-03-27T17:00:00Z'},
            {productId: 3785, productName: 'Массажная свеча с ароматом шоколада Bougie Massage Candle35', vendorCode: 'id-19549-1366', oldPrice: 749, newPrice: 1058, changeAmount: 309, changePercent: 41.3, date: '2025-03-27T17:00:00Z'},
            {productId: 3786, productName: 'Массажная свеча с ароматом кокоса Bougie Massage Candle 35мл', vendorCode: 'id-19543-1366', oldPrice: 758, newPrice: 1063, changeAmount: 305, changePercent: 40.2, date: '2025-03-27T17:00:00Z'},
            {productId: 3787, productName: 'Массажная свеча с ароматом мультифрукт Bougie MassageCandle', vendorCode: 'id-18147-1366', oldPrice: 1658, newPrice: 2286, changeAmount: 628, changePercent: 37.9, date: '2025-03-27T17:00:00Z'},
            {productId: 3788, productName: 'Светящийся в темноте Beyond by Toyfa', vendorCode: 'id-22754-1366', oldPrice: 1841, newPrice: 2530, changeAmount: 689, changePercent: 37.4, date: '2025-03-27T17:00:00Z'},
            {productId: 3789, productName: 'Автоматический мастурбатор PDX Elite Moto Bator X 5 режимов', vendorCode: 'id-25708-1366', oldPrice: 9009, newPrice: 11667, changeAmount: 2658, changePercent: 29.5, date: '2025-03-27T17:00:00Z'}
        ];

        if (priceState.filter.minChangeAmount) {
            priceState.items = priceState.items.filter(item => item.changeAmount >= priceState.filter.minChangeAmount);
        }

        priceState.totalCount = priceState.items.length;
        priceState.hasMore = false;

        updatePriceChangesTable();
        updatePriceLoadMoreButton();
        updatePriceCounters();

        toastr.warning('Загружены демонстрационные данные из-за ограничений CORS');
    }

    function loadMockStockData() {
        stockState.items = [
            {productId: 101, productName: 'Футболка спортивная', vendorCode: 'FS-001', warehouseId: 575679, warehouseName: 'X-sklad SPB', oldAmount: 245, newAmount: 230, changeAmount: -15, changePercent: -6.1, date: '2025-03-15T12:45:00'},
            {productId: 102, productName: 'Кроссовки беговые', vendorCode: 'KB-103', warehouseId: 575682, warehouseName: 'X-sklad MSK', oldAmount: 62, newAmount: 54, changeAmount: -8, changePercent: -12.9, date: '2025-03-14T10:30:00'},
            {productId: 103, productName: 'Куртка зимняя', vendorCode: 'KZ-201', warehouseId: 575679, warehouseName: 'X-sklad SPB', oldAmount: 25, newAmount: 32, changeAmount: 7, changePercent: 28.0, date: '2025-03-15T09:15:00'},
            {productId: 104, productName: 'Шапка вязаная', vendorCode: 'SV-050', warehouseId: 575682, warehouseName: 'X-sklad MSK', oldAmount: 106, newAmount: 120, changeAmount: 14, changePercent: 13.2, date: '2025-03-13T14:20:00'}
        ];

        stockState.totalCount = 4;
        stockState.hasMore = false;

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