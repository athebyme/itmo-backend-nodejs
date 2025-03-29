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
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };

    // Connect to price changes SSE endpoint
    const priceEventsSource = new EventSource('/api/sse/price-changes');

    priceEventsSource.addEventListener('price-change', function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Price change event received:', data);

            // Display notification
            showPriceChangeNotification(data);

            // Update UI if needed
            updatePriceChangeUI(data);
        } catch (error) {
            console.error('Error processing price change event:', error);
        }
    });

    // Connect to stock changes SSE endpoint
    const stockEventsSource = new EventSource('/api/sse/stock-changes');

    stockEventsSource.addEventListener('stock-change', function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Stock change event received:', data);

            // Display notification
            showStockChangeNotification(data);

            // Update UI if needed
            updateStockChangeUI(data);
        } catch (error) {
            console.error('Error processing stock change event:', error);
        }
    });

    // Error handling for SSE connections
    priceEventsSource.onerror = function(error) {
        console.error('Error in price changes SSE connection:', error);
        setTimeout(() => {
            console.log('Attempting to reconnect to price changes...');
            // The browser will automatically try to reconnect
        }, 5000);
    };

    stockEventsSource.onerror = function(error) {
        console.error('Error in stock changes SSE connection:', error);
        setTimeout(() => {
            console.log('Attempting to reconnect to stock changes...');
            // The browser will automatically try to reconnect
        }, 5000);
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

    // Functions to update UI elements with new data
    function updatePriceChangeUI(priceChange) {
        // Find if this product is in the price changes table
        const priceTable = document.getElementById('price-changes-table');
        if (!priceTable) return;

        // Check if we need to add this as a new row or update existing
        const rows = priceTable.querySelectorAll('tbody tr');
        let found = false;

        rows.forEach(row => {
            const vendorCode = row.querySelector('td:nth-child(3)').textContent;
            if (vendorCode === priceChange.vendorCode) {
                found = true;
                // Update row data
                updatePriceChangeRow(row, priceChange);
            }
        });

        // If not found and we have a table, add as first row
        if (!found && rows.length > 0) {
            const newRow = createPriceChangeRow(priceChange);
            const tbody = priceTable.querySelector('tbody');
            if (tbody.firstChild) {
                tbody.insertBefore(newRow, tbody.firstChild);
            } else {
                tbody.appendChild(newRow);
            }

            // Remove last row if we have more than 20
            if (rows.length >= 20) {
                tbody.removeChild(tbody.lastChild);
            }

            // Highlight new row
            newRow.classList.add('highlight-new');
            setTimeout(() => {
                newRow.classList.remove('highlight-new');
            }, 3000);
        }
    }

    function updateStockChangeUI(stockChange) {
        // Find if this product is in the stock changes table
        const stockTable = document.getElementById('stock-changes-table');
        if (!stockTable) return;

        // Check if we need to add this as a new row or update existing
        const rows = stockTable.querySelectorAll('tbody tr');
        let found = false;

        rows.forEach(row => {
            const vendorCode = row.querySelector('td:nth-child(3)').textContent;
            const warehouseId = row.getAttribute('data-warehouse-id');

            if (vendorCode === stockChange.vendorCode &&
                warehouseId == stockChange.warehouseId) {
                found = true;
                // Update row data
                updateStockChangeRow(row, stockChange);
            }
        });

        // If not found and we have a table, add as first row
        if (!found && rows.length > 0) {
            const newRow = createStockChangeRow(stockChange);
            const tbody = stockTable.querySelector('tbody');
            if (tbody.firstChild) {
                tbody.insertBefore(newRow, tbody.firstChild);
            } else {
                tbody.appendChild(newRow);
            }

            // Remove last row if we have more than 20
            if (rows.length >= 20) {
                tbody.removeChild(tbody.lastChild);
            }

            // Highlight new row
            newRow.classList.add('highlight-new');
            setTimeout(() => {
                newRow.classList.remove('highlight-new');
            }, 3000);
        }
    }

    // Helper functions to create and update table rows
    function createPriceChangeRow(priceChange) {
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', priceChange.productId);

        const changeClass = priceChange.changePercent >= 0 ? 'price-increase' : 'price-decrease';
        const changeSign = priceChange.changePercent >= 0 ? '+' : '';

        row.innerHTML = `
            <td>${priceChange.productName}</td>
            <td>${new Date(priceChange.date).toLocaleString()}</td>
            <td>${priceChange.vendorCode}</td>
            <td>${priceChange.oldPrice.toLocaleString()} ₽</td>
            <td>${priceChange.newPrice.toLocaleString()} ₽</td>
            <td class="${changeClass}">${changeSign}${priceChange.changeAmount.toLocaleString()} ₽</td>
            <td class="${changeClass}">${changeSign}${priceChange.changePercent.toFixed(1)}%</td>
        `;

        return row;
    }

    function updatePriceChangeRow(row, priceChange) {
        // Update only the values that might have changed
        const cells = row.querySelectorAll('td');

        const changeClass = priceChange.changePercent >= 0 ? 'price-increase' : 'price-decrease';
        const changeSign = priceChange.changePercent >= 0 ? '+' : '';

        cells[1].textContent = new Date(priceChange.date).toLocaleString();
        cells[3].textContent = `${priceChange.oldPrice.toLocaleString()} ₽`;
        cells[4].textContent = `${priceChange.newPrice.toLocaleString()} ₽`;

        cells[5].textContent = `${changeSign}${priceChange.changeAmount.toLocaleString()} ₽`;
        cells[5].className = changeClass;

        cells[6].textContent = `${changeSign}${priceChange.changePercent.toFixed(1)}%`;
        cells[6].className = changeClass;

        // Highlight updated row
        row.classList.add('highlight-update');
        setTimeout(() => {
            row.classList.remove('highlight-update');
        }, 3000);
    }

    function createStockChangeRow(stockChange) {
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', stockChange.productId);
        row.setAttribute('data-warehouse-id', stockChange.warehouseId);

        const changeClass = stockChange.changePercent >= 0 ? 'stock-increase' : 'stock-decrease';
        const changeSign = stockChange.changePercent >= 0 ? '+' : '';

        row.innerHTML = `
            <td>${stockChange.productName}</td>
            <td>${new Date(stockChange.date).toLocaleString()}</td>
            <td>${stockChange.vendorCode}</td>
            <td>${stockChange.warehouseName}</td>
            <td>${stockChange.oldAmount.toLocaleString()}</td>
            <td>${stockChange.newAmount.toLocaleString()}</td>
            <td class="${changeClass}">${changeSign}${stockChange.changeAmount.toLocaleString()}</td>
            <td class="${changeClass}">${changeSign}${stockChange.changePercent.toFixed(1)}%</td>
        `;

        return row;
    }

    function updateStockChangeRow(row, stockChange) {
        // Update only the values that might have changed
        const cells = row.querySelectorAll('td');

        const changeClass = stockChange.changePercent >= 0 ? 'stock-increase' : 'stock-decrease';
        const changeSign = stockChange.changePercent >= 0 ? '+' : '';

        cells[1].textContent = new Date(stockChange.date).toLocaleString();
        cells[4].textContent = stockChange.oldAmount.toLocaleString();
        cells[5].textContent = stockChange.newAmount.toLocaleString();

        cells[6].textContent = `${changeSign}${stockChange.changeAmount.toLocaleString()}`;
        cells[6].className = changeClass;

        cells[7].textContent = `${changeSign}${stockChange.changePercent.toFixed(1)}%`;
        cells[7].className = changeClass;

        // Highlight updated row
        row.classList.add('highlight-update');
        setTimeout(() => {
            row.classList.remove('highlight-update');
        }, 3000);
    }
});