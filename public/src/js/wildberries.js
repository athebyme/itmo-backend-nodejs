document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    const productIDsInput = document.getElementById('productIDs');
    const productImagesList = document.getElementById('product-images');
    const preloader = document.getElementById('preloader');
    const errorMessage = document.getElementById('error-message');

    // скрыть прелоадер и сообщения об ошибках изначально
    preloader.style.display = 'none';
    errorMessage.style.display = 'none';

    // функция для отправки запроса и отображения изображений
    const fetchProductImages = async (productIDs) => {
        try {
            // Показать preloader
            preloader.style.display = 'block';
            productImagesList.innerHTML = ''; // очистить список
            errorMessage.style.display = 'none';

            const response = await fetch('https://media.athebyme-market.ru:8081/api/media', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productIDs }), // используем массив чисел
                mode: 'cors', // Explicit CORS mode
                credentials: 'same-origin', // Only send credentials if the URL is same-origin
            });

            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
            }

            let imageUrls = await response.json();

            // Обновляем URL: принудительно устанавливаем протокол HTTPS и порт 8081 для каждого
            imageUrls = imageUrls.map(url => {
                try {
                    const parsedUrl = new URL(url);
                    parsedUrl.protocol = 'https:'; // принудительно HTTPS
                    parsedUrl.port = '8081'; // устанавливаем порт
                    return parsedUrl.toString();
                } catch (e) {
                    console.error('Ошибка парсинга URL:', url, e);
                    return url;
                }
            });

            // проверяем, что данные - это массив
            if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
                throw new Error('Нет данных для отображения.');
            }

            // Группируем изображения по ID товара
            const productImagesMap = {};

            imageUrls.forEach(newUrl => {
                // Извлекаем ID товара из URL (например, из "https://media.athebyme-market.ru:8081/9575/0.jpg" получаем "9575")
                const matches = newUrl.match(/\/(\d+)\/\d+\.jpg$/);
                if (matches && matches[1]) {
                    const productId = matches[1];
                    if (!productImagesMap[productId]) {
                        productImagesMap[productId] = [];
                    }
                    productImagesMap[productId].push(newUrl);
                }
            });

            // создание таблицы
            const table = document.createElement('table');
            table.classList.add('product-table');
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>ID товара</th>
                    <th>Изображения</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            Object.entries(productImagesMap).forEach(([id, images]) => {
                const row = document.createElement('tr');
                const idCell = document.createElement('td');
                idCell.textContent = id;

                const imagesCell = document.createElement('td');
                if (images.length > 0) {
                    images.forEach(imageUrl => {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.alt = `Товар ${id}`;
                        img.classList.add('product-image');
                        imagesCell.appendChild(img);
                    });
                } else {
                    imagesCell.textContent = 'Нет изображений';
                }

                row.appendChild(idCell);
                row.appendChild(imagesCell);
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            productImagesList.appendChild(table);
        } catch (error) {
            console.error('Error:', error);
            // Проверка на CORS ошибку
            if (error.message.includes('NetworkError') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('CORS')) {
                errorMessage.textContent = 'Ошибка CORS: Сервер не разрешает запросы с этого источника. Необходимо настроить CORS на сервере или использовать прокси.';
            } else {
                errorMessage.textContent = `Произошла ошибка: ${error.message}`;
            }
            errorMessage.style.display = 'block';
        } finally {
            // Скрыть preloader
            preloader.style.display = 'none';
        }
    };

    // обработчик формы
    productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const productIDsInputValue = productIDsInput.value.trim();
        if (productIDsInputValue === "") {
            fetchProductImages(null); // если пусто, получить все фотографии
            return;
        }

        const productIDs = productIDsInputValue
            .split(',')
            .map(id => parseInt(id.trim(), 10)) // преобразуем в числа
            .filter(id => !isNaN(id)); // убираем некорректные значения

        const allNumbers = productIDsInputValue.split(',')
            .map(id => id.trim())
            .every(id => /^[0-9]+$/.test(id)); // проверяем, что все ID - числа

        if (!allNumbers) {
            errorMessage.textContent = 'Пожалуйста, введите корректные ID товаров (только числа).';
            errorMessage.style.display = 'block';
            return;
        }

        fetchProductImages(productIDs);
    });
});
