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
    const getApiBaseUrl = () => `https://199.83.103.182/${currentSeller}`;

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