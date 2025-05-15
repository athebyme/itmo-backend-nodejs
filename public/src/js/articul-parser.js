document.addEventListener('DOMContentLoaded', function() {
    const articulInput = document.getElementById('articul-input');
    const parseBtn = document.getElementById('parse-btn');
    const resultContainer = document.getElementById('result-container');
    const resultContent = document.getElementById('result-content');
    const exampleCards = document.querySelectorAll('.example-card');
    
    // Обработчик клика на кнопку разбора
    parseBtn.addEventListener('click', function() {
        const articul = articulInput.value.trim();
        if (articul) {
            displayResult(articul);
        }
    });
    
    // Обработка нажатия Enter в поле ввода
    articulInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            parseBtn.click();
        }
    });
    
    // Обработчики кликов на примеры
    exampleCards.forEach(card => {
        card.addEventListener('click', function() {
            const articul = this.getAttribute('data-articul');
            articulInput.value = articul;
            displayResult(articul);
        });
    });
    
    // Функция для отображения результата
    function displayResult(articul) {
        const result = read_prod_data_from_seller_articul(articul);
        
        let html = '';
        for (const key in result) {
            html += `
            <div class="prop-item">
                <div class="prop-name">$prod_data[${key}]</div>
                <div class="prop-value">'${result[key]}'</div>
            </div>
            `;
        }
        
        resultContent.innerHTML = html;
        resultContainer.classList.remove('d-none');
        
        // Прокрутка к результату
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Реализация функции read_prod_data_from_seller_articul
    function read_prod_data_from_seller_articul(articul) {
        // Словарь соответствия однобуквенных префиксов поставщика двухбуквенным
        const long_seller_prefix = {
            'A': 'an', // ООО АНДРЕЙ
            'S': 'sx'  // СексОптовик
        };
        
        let prod_data = {};
        
        // Исходный артикул
        prod_data.product_id = articul.trim();
        
        // Удаление 'wb' из начала или конца артикула
        articul = articul.replace(/wb$/i, '');
        articul = articul.replace(/^wb/i, '');
        
        // Замена опечатки 'WW' на 'W'
        articul = articul.replace(/WW1C/i, 'W1C');
        
        // Проверка на сложный формат
        const regex = /^(\d+)(\D)(\d+)(\D)(\d+)(\D)(.*)?/;
        const matches = regex.exec(articul.trim());
        
        if (matches) {
            // Сложный формат
            prod_data.prod_id = matches[1];
            prod_data.mp_id = matches[2];
            prod_data.clone_id = matches[3];
            prod_data.client_id = matches[4];
            prod_data.version = matches[5];
            prod_data.seller_prefix = matches[6];
            prod_data.sx_id = matches[7];
            
            // Коррекция sx_id из-за глюка WB
            if (prod_data.sx_id && /.+_\d+_*\d+$/.test(prod_data.sx_id)) {
                prod_data.sx_id = prod_data.sx_id.replace(/_\d+_*\d+$/, '');
            }
            
            prod_data.seller_articul = prod_data.sx_id;
            
            // Корректировка артикула товара для поставщика ООО АНДРЕЙ
            if (prod_data.seller_prefix === "A") {
                prod_data.seller_articul = prod_data.seller_articul.replace(/yt/i, 'УТ');
                prod_data.seller_articul = prod_data.seller_articul.toUpperCase();
                // iconv не эмулируем
            }
            
            // Преобразование однобуквенного префикса поставщика в двухбуквенный
            prod_data.seller = long_seller_prefix[prod_data.seller_prefix];
            
        } else {
            // Простой формат
            articul = articul.replace(/^id-/i, '');
            const pieces = articul.trim().split("-");
            
            prod_data.seller_prefix = 'S';
            prod_data.seller = long_seller_prefix[prod_data.seller_prefix];
            prod_data.sx_id = pieces[0];
            prod_data.seller_articul = prod_data.sx_id;
        }
        
        return prod_data;
    }
    
    // Разбор примера по умолчанию при загрузке
    displayResult(articulInput.value);
});