document.addEventListener('DOMContentLoaded', function() {
    const amountInput = document.getElementById('amountInput');
    const cryptoSelect = document.getElementById('cryptoSelect');
    const currencySelect = document.getElementById('currencySelect');
    const convertBtn = document.getElementById('convertBtn');
    const resultContainer = document.getElementById('resultContainer');
    const cryptoAmount = document.getElementById('cryptoAmount');
    const cryptoSymbol = document.getElementById('cryptoSymbol');
    const convertedAmount = document.getElementById('convertedAmount');
    const currencySymbol = document.getElementById('currencySymbol');
    const updateTime = document.getElementById('updateTime');
    const errorMessage = document.getElementById('errorMessage');
    const historyTable = document.getElementById('historyTable').querySelector('tbody');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const cryptoMap = {
        'BTCUSDT': 'bitcoin',
        'ETHUSDT': 'ethereum',
        'BNBUSDT': 'binancecoin',
        'SOLUSDT': 'solana'
    };

    const currencySymbols = {
        'usd': '$',
        'eur': '€',
        'rub': '₽',
    };

    loadHistory();

    convertBtn.addEventListener('click', function() {
        const amount = parseFloat(amountInput.value);
        const symbol = cryptoSelect.value;
        const cryptoName = cryptoSelect.options[cryptoSelect.selectedIndex].text;
        const currency = currencySelect.value;

        if (isNaN(amount) || amount <= 0) {
            showError('Пожалуйста, введите корректное число');
            return;
        }

        fetchCryptoPrice(symbol, amount, cryptoName, currency);
    });

    clearHistoryBtn.addEventListener('click', function() {
        localStorage.removeItem('conversionHistory');
        historyTable.innerHTML = '';
        toastr.success('История конвертаций очищена');
    });

    function fetchCryptoPrice(symbol, amount, cryptoName, currency) {
        resultContainer.classList.add('d-none');
        errorMessage.classList.add('d-none');

        toastr.info('Получение данных о курсе...');

        const coinId = cryptoMap[symbol];
        if (!coinId) {
            showError('Неподдерживаемая криптовалюта');
            return;
        }

        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при получении данных');
                }
                return response.json();
            })
            .then(data => {
                if (!data || !data[coinId] || !data[coinId][currency]) {
                    throw new Error('Некорректный ответ от API');
                }

                const price = parseFloat(data[coinId][currency]);
                const totalConverted = (amount * price).toFixed(2);
                const shortSymbol = symbol.replace('USDT', '');

                cryptoAmount.textContent = amount;
                cryptoSymbol.textContent = shortSymbol;
                convertedAmount.textContent = totalConverted;
                currencySymbol.textContent = currency.toUpperCase();

                const date = new Date();
                updateTime.textContent = date.toLocaleString();

                resultContainer.classList.remove('d-none');

                addToHistory({
                    date: date.toLocaleString(),
                    crypto: shortSymbol,
                    cryptoName: cryptoName.split(' ')[0],
                    amount: amount,
                    convertedValue: totalConverted,
                    currency: currency.toUpperCase(),
                    currencySymbol: currencySymbols[currency] || '',
                    rate: price
                });

                toastr.success('Конвертация выполнена успешно');
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showError('Произошла ошибка при получении данных о курсе');
            });
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        toastr.error(message);
    }

    function addToHistory(entry) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.cryptoName}</td>
            <td>${entry.amount}</td>
            <td>${entry.currencySymbol}${entry.convertedValue} ${entry.currency}</td>
            <td>${entry.currencySymbol}${parseFloat(entry.rate).toFixed(2)}</td>
        `;

        historyTable.insertBefore(row, historyTable.firstChild);

        saveToHistory(entry);
    }

    function saveToHistory(entry) {
        let history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
        history.unshift(entry);

        if (history.length > 10) {
            history = history.slice(0, 10);
        }

        localStorage.setItem('conversionHistory', JSON.stringify(history));
    }

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');

        history.forEach(entry => {
            const row = document.createElement('tr');
            const currencySymbol = entry.currencySymbol || '';
            const currency = entry.currency || 'USD';

            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.cryptoName}</td>
                <td>${entry.amount}</td>
                <td>${currencySymbol}${entry.convertedValue} ${currency}</td>
                <td>${currencySymbol}${parseFloat(entry.rate).toFixed(2)}</td>
            `;
            historyTable.appendChild(row);
        });
    }
});