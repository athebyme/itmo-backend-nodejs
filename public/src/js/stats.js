document.addEventListener('DOMContentLoaded', function() {
    // Initialize toastr notifications
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: '5000'
    };

    // Check authentication
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.replace('./');
        return;
    }

    // Initialize chart objects
    let priceChangesChart = null;
    let stockChangesChart = null;

    // Elements
    const sellerSelect = document.getElementById('sellerSelect');
    const refreshBtn = document.getElementById('refreshBtn');
    const apiStatus = document.getElementById('apiStatus');
    const apiError = document.getElementById('apiError');
    const errorMessage = document.getElementById('errorMessage');

    // Stats filters
    const topProductsLimit = document.getElementById('topProductsLimit');
    const topProductsSort = document.getElementById('topProductsSort');
    const priceChangesLimit = document.getElementById('priceChangesLimit');
    const stockChangesLimit = document.getElementById('stockChangesLimit');
    const warehouseFilter = document.getElementById('warehouseFilter');

    // Get current seller from URL or select element
    let currentSeller = new URLSearchParams(window.location.search).get('seller') || 'bananzza';
    sellerSelect.value = currentSeller;

    // Base API URL
    const getApiBaseUrl = () => `http://199.83.103.182/${currentSeller}`;

    // Initialize data loading
    loadAllData();

    // Event handlers
    sellerSelect.addEventListener('change', function() {
        currentSeller = this.value;
        window.history.replaceState(null, null, `?seller=${currentSeller}`);
        loadAllData();
    });

    refreshBtn.addEventListener('click', loadAllData);
    topProductsLimit.addEventListener('change', loadTopProducts);
    topProductsSort.addEventListener('change', loadTopProducts);
    priceChangesLimit.addEventListener('change', loadPriceChanges);
    stockChangesLimit.addEventListener('change', loadStockChanges);
    warehouseFilter.addEventListener('change', loadStockChanges);

    // Tab change events
    document.getElementById('price-changes-tab').addEventListener('shown.bs.tab', function() {
        loadPriceChanges();
    });

    document.getElementById('stock-changes-tab').addEventListener('shown.bs.tab', function() {
        loadStockChanges();
    });

    // Load all data sections
    function loadAllData() {
        showLoading();

        Promise.all([
            loadOverviewStats(),
            loadTopProducts(),
            loadPriceChanges(),
            loadStockChanges(),
            loadWarehouses()
        ])
            .then(() => {
                hideLoading();
                toastr.success('Данные успешно загружены');
            })
            .catch(err => {
                hideLoading();
                showError('Произошла ошибка при загрузке данных: ' + err.message);
                console.error('Loading error:', err);

                // Load mock data if the API fails
                loadMockData();
            });
    }

    // Load mock data when API is unavailable
    function loadMockData() {
        toastr.warning('Загружены демонстрационные данные, так как API недоступен');

        // Mock overview stats
        document.getElementById('totalProducts').textContent = '142';
        document.getElementById('totalStock').textContent = '15,876';
        document.getElementById('avgPrice').textContent = '3 500 ₽';
        document.getElementById('lowStockItems').textContent = '12';

        // Mock top products
        const mockProducts = [
            {id: 101, name: 'Футболка спортивная', vendorCode: 'FS-001', currentPrice: 1500, priceChange: 12.5, totalStock: 230, stockChange: -5.2, lastUpdated: '15.03.2025 12:45'},
            {id: 102, name: 'Кроссовки беговые', vendorCode: 'KB-103', currentPrice: 4500, priceChange: -3.8, totalStock: 54, stockChange: -15.4, lastUpdated: '14.03.2025 10:30'},
            {id: 103, name: 'Куртка зимняя', vendorCode: 'KZ-201', currentPrice: 8700, priceChange: 5.2, totalStock: 32, stockChange: 25.0, lastUpdated: '15.03.2025 09:15'},
            {id: 104, name: 'Шапка вязаная', vendorCode: 'SV-050', currentPrice: 950, priceChange: 0.0, totalStock: 120, stockChange: 10.5, lastUpdated: '13.03.2025 14:20'},
            {id: 105, name: 'Перчатки спортивные', vendorCode: 'PS-075', currentPrice: 780, priceChange: -8.5, totalStock: 86, stockChange: -30.2, lastUpdated: '15.03.2025 16:10'},
        ];

        updateTopProductsTable(mockProducts);

        // Create mock charts
        const chartLabels = mockProducts.map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name);
        const priceData = mockProducts.map(p => p.priceChange);
        const stockData = mockProducts.map(p => p.stockChange);

        priceChangesChart = initChart('priceChangesChart', 'bar', chartLabels, [
            {
                label: 'Изменение цены (%)',
                data: priceData,
                backgroundColor: priceData.map(val => val >= 0 ? 'rgba(20, 184, 166, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
                borderColor: priceData.map(val => val >= 0 ? 'rgb(20, 184, 166)' : 'rgb(239, 68, 68)'),
                borderWidth: 1
            }
        ]);

        stockChangesChart = initChart('stockChangesChart', 'bar', chartLabels, [
            {
                label: 'Изменение остатков (%)',
                data: stockData,
                backgroundColor: stockData.map(val => val >= 0 ? 'rgba(93, 95, 239, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
                borderColor: stockData.map(val => val >= 0 ? 'rgb(93, 95, 239)' : 'rgb(239, 68, 68)'),
                borderWidth: 1
            }
        ]);

        // Mock price changes
        const mockPriceChanges = [
            {productName: 'Футболка спортивная', vendorCode: 'FS-001', oldPrice: 1200, newPrice: 1500, changeAmount: 300, changePercent: 25.0, date: '2025-03-15T12:45:00'},
            {productName: 'Кроссовки беговые', vendorCode: 'KB-103', oldPrice: 4680, newPrice: 4500, changeAmount: -180, changePercent: -3.8, date: '2025-03-14T10:30:00'},
            {productName: 'Куртка зимняя', vendorCode: 'KZ-201', oldPrice: 8200, newPrice: 8700, changeAmount: 500, changePercent: 6.1, date: '2025-03-15T09:15:00'},
            {productName: 'Перчатки спортивные', vendorCode: 'PS-075', oldPrice: 850, newPrice: 780, changeAmount: -70, changePercent: -8.2, date: '2025-03-15T16:10:00'},
        ];

        updatePriceChangesTable(mockPriceChanges);

        // Mock stock changes
        const mockStockChanges = [
            {productName: 'Футболка спортивная', vendorCode: 'FS-001', warehouseName: 'Центральный', oldAmount: 245, newAmount: 230, changeAmount: -15, changePercent: -6.1, date: '2025-03-15T12:45:00'},
            {productName: 'Кроссовки беговые', vendorCode: 'KB-103', warehouseName: 'Южный', oldAmount: 62, newAmount: 54, changeAmount: -8, changePercent: -12.9, date: '2025-03-14T10:30:00'},
            {productName: 'Куртка зимняя', vendorCode: 'KZ-201', warehouseName: 'Центральный', oldAmount: 25, newAmount: 32, changeAmount: 7, changePercent: 28.0, date: '2025-03-15T09:15:00'},
            {productName: 'Шапка вязаная', vendorCode: 'SV-050', warehouseName: 'Восточный', oldAmount: 106, newAmount: 120, changeAmount: 14, changePercent: 13.2, date: '2025-03-13T14:20:00'},
        ];

        updateStockChangesTable(mockStockChanges);

        // Mock warehouses
        warehouseFilter.innerHTML = '<option value="">Все склады</option>';
        ['Центральный', 'Южный', 'Восточный', 'Западный'].forEach((name, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = name;
            warehouseFilter.appendChild(option);
        });
    }

    // Show loading indicator
    function showLoading() {
        apiStatus.classList.remove('d-none');
        apiError.classList.add('d-none');
    }

    // Hide loading indicator
    function hideLoading() {
        apiStatus.classList.add('d-none');
    }

    // Show error message
    function showError(message) {
        apiError.classList.remove('d-none');
        errorMessage.textContent = message;
        toastr.error(message);
    }

    // Format currency
    function formatCurrency(value) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(value);
    }

    // Format number with thousand separators
    function formatNumber(value) {
        return new Intl.NumberFormat('ru-RU').format(value);
    }

    // Format percentage
    function formatPercentage(value) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value / 100);
    }

    // Format date
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

    // Get badge HTML for percentage change
    function getChangeBadge(percentage) {
        if (percentage > 0) {
            return `<span class="badge bg-success">+${percentage.toFixed(1)}%</span>`;
        } else if (percentage < 0) {
            return `<span class="badge bg-danger">${percentage.toFixed(1)}%</span>`;
        } else {
            return `<span class="badge bg-secondary">0%</span>`;
        }
    }

    // Update top products table
    function updateTopProductsTable(products) {
        const tableBody = document.querySelector('#topProductsTable tbody');
        tableBody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.vendorCode}</td>
                <td>${formatCurrency(product.currentPrice)}</td>
                <td>${getChangeBadge(product.priceChange)}</td>
                <td>${formatNumber(product.totalStock)}</td>
                <td>${getChangeBadge(product.stockChange)}</td>
                <td>${product.lastUpdated}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Update price changes table
    function updatePriceChangesTable(changes) {
        const tableBody = document.querySelector('#priceChangesTable tbody');
        tableBody.innerHTML = '';

        changes.forEach(change => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${change.productName}</td>
                <td>${change.vendorCode}</td>
                <td>${formatCurrency(change.oldPrice)}</td>
                <td>${formatCurrency(change.newPrice)}</td>
                <td>${formatCurrency(change.changeAmount)}</td>
                <td>${getChangeBadge(change.changePercent)}</td>
                <td>${formatDate(change.date)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Update stock changes table
    function updateStockChangesTable(changes) {
        const tableBody = document.querySelector('#stockChangesTable tbody');
        tableBody.innerHTML = '';

        changes.forEach(change => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${change.productName}</td>
                <td>${change.vendorCode}</td>
                <td>${change.warehouseName}</td>
                <td>${formatNumber(change.oldAmount)}</td>
                <td>${formatNumber(change.newAmount)}</td>
                <td>${formatNumber(change.changeAmount)}</td>
                <td>${getChangeBadge(change.changePercent)}</td>
                <td>${formatDate(change.date)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Initialize a chart
    function initChart(chartId, type, labels, datasets) {
        const ctx = document.getElementById(chartId).getContext('2d');

        // Destroy existing chart if it exists
        if (window[chartId + 'Chart']) {
            window[chartId + 'Chart'].destroy();
        }

        return new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    // Load overview statistics
    async function loadOverviewStats() {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/stats/overview`);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const data = await response.json();

            // Update the overview stats cards
            document.getElementById('totalProducts').textContent = formatNumber(data.totalProducts);
            document.getElementById('totalStock').textContent = formatNumber(data.totalStock);
            document.getElementById('avgPrice').textContent = formatCurrency(data.avgPrice);
            document.getElementById('lowStockItems').textContent = formatNumber(data.lowStockItems);

            return data;
        } catch (error) {
            console.error('Error loading overview stats:', error);
            throw error;
        }
    }

    // Load top products
    async function loadTopProducts() {
        try {
            const limit = topProductsLimit.value || 10;
            const response = await fetch(`${getApiBaseUrl()}/api/stats/products?limit=${limit}`);

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const products = await response.json();

            // Sort products based on selected criteria
            const sortCriteria = topProductsSort.value || 'priceChange';

            products.sort((a, b) => {
                if (sortCriteria === 'priceChange') {
                    return Math.abs(b.priceChange) - Math.abs(a.priceChange);
                } else if (sortCriteria === 'stockChange') {
                    return Math.abs(b.stockChange) - Math.abs(a.stockChange);
                } else if (sortCriteria === 'price') {
                    return b.currentPrice - a.currentPrice;
                }
                return 0;
            });

            // Update top products table
            const tableBody = document.querySelector('#topProductsTable tbody');

            if (products.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Нет данных</td></tr>';
                return;
            }

            updateTopProductsTable(products);

            // Prepare data for charts
            const chartLabels = products.slice(0, 5).map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name);

            // Price changes chart
            const priceData = products.slice(0, 5).map(p => p.priceChange);
            priceChangesChart = initChart('priceChangesChart', 'bar', chartLabels, [
                {
                    label: 'Изменение цены (%)',
                    data: priceData,
                    backgroundColor: priceData.map(val => val >= 0 ? 'rgba(20, 184, 166, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
                    borderColor: priceData.map(val => val >= 0 ? 'rgb(20, 184, 166)' : 'rgb(239, 68, 68)'),
                    borderWidth: 1
                }
            ]);

            // Stock changes chart
            const stockData = products.slice(0, 5).map(p => p.stockChange);
            stockChangesChart = initChart('stockChangesChart', 'bar', chartLabels, [
                {
                    label: 'Изменение остатков (%)',
                    data: stockData,
                    backgroundColor: stockData.map(val => val >= 0 ? 'rgba(93, 95, 239, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
                    borderColor: stockData.map(val => val >= 0 ? 'rgb(93, 95, 239)' : 'rgb(239, 68, 68)'),
                    borderWidth: 1
                }
            ]);

            return products;
        } catch (error) {
            console.error('Error loading top products:', error);
            throw error;
        }
    }

    // Load price changes
    async function loadPriceChanges() {
        try {
            const limit = priceChangesLimit.value || 20;
            const response = await fetch(`${getApiBaseUrl()}/api/stats/price-changes?limit=${limit}`);

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const changes = await response.json();

            // Update price changes table
            const tableBody = document.querySelector('#priceChangesTable tbody');

            if (changes.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Нет данных</td></tr>';
                return;
            }

            updatePriceChangesTable(changes);

            return changes;
        } catch (error) {
            console.error('Error loading price changes:', error);
            throw error;
        }
    }

    // Load stock changes
    async function loadStockChanges() {
        try {
            const limit = stockChangesLimit.value || 20;
            const warehouseId = warehouseFilter.value || '';

            let url = `${getApiBaseUrl()}/api/stats/stock-changes?limit=${limit}`;
            if (warehouseId) {
                url += `&warehouseId=${warehouseId}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const changes = await response.json();

            // Update stock changes table
            const tableBody = document.querySelector('#stockChangesTable tbody');

            if (changes.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Нет данных</td></tr>';
                return;
            }

            updateStockChangesTable(changes);

            return changes;
        } catch (error) {
            console.error('Error loading stock changes:', error);
            throw error;
        }
    }

    // Load warehouses for filter
    async function loadWarehouses() {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/stats/warehouses`);

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const warehouses = await response.json();

            // Update warehouse filter dropdown
            warehouseFilter.innerHTML = '<option value="">Все склады</option>';

            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                warehouseFilter.appendChild(option);
            });

            return warehouses;
        } catch (error) {
            console.error('Error loading warehouses:', error);
            // Don't throw here to avoid breaking the whole page if just warehouses fail
            return [];
        }
    }
});