document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    const productIDsInput = document.getElementById('productIDs');
    const productImagesList = document.getElementById('product-images');
    const preloader = document.getElementById('preloader');
    const errorMessage = document.getElementById('error-message');

    preloader.style.display = 'none';
    errorMessage.style.display = 'none';

    const fetchProductImages = async (productIDs) => {
        try {
            preloader.style.display = 'block';
            productImagesList.innerHTML = '';
            errorMessage.style.display = 'none';

            const response = await fetch('https://media.athebyme-market.ru:8081/api/media', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productIDs }),
                mode: 'cors',
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
            }

            let imageUrls = await response.json();

            imageUrls = imageUrls.map(url => {
                try {
                    const parsedUrl = new URL(url);
                    parsedUrl.protocol = 'https:';
                    parsedUrl.port = '8081';
                    return parsedUrl.toString();
                } catch (e) {
                    console.error('Ошибка парсинга URL:', url, e);
                    return url;
                }
            });

            if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
                throw new Error('Нет данных для отображения.');
            }

            // группировка изображения по ID товара
            const productImagesMap = {};
            imageUrls.forEach(newUrl => {
                const matches = newUrl.match(/\/(\d+)\/\d+\.jpg$/);
                if (matches && matches[1]) {
                    const productId = matches[1];
                    if (!productImagesMap[productId]) {
                        productImagesMap[productId] = [];
                    }
                    productImagesMap[productId].push(newUrl);
                }
            });

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
            let friendlyMessage = '';

            if (error.message.includes('NetworkError') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('CORS')) {
                friendlyMessage = 'Сетевая ошибка. Сервер может быть недоступен или возникла проблема с CORS. Попробуйте повторить запрос позже.';
            } else if (error.message.includes('404')) {
                friendlyMessage = 'Запрашиваемые данные не найдены (404). Проверьте правильность введённых ID товаров.';
            } else {
                friendlyMessage = `Произошла ошибка: ${error.message}`;
            }

            errorMessage.innerHTML = `
                <div class="error-notification">
                    <h3>Упс! Что-то пошло не так</h3>
                    <p>${friendlyMessage}</p>
                    <p>Попробуйте обновить страницу или ввести другой артикул.</p>
                </div>
            `;
            errorMessage.style.display = 'block';
        } finally {
            preloader.style.display = 'none';
        }
    };

    productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const productIDsInputValue = productIDsInput.value.trim();
        if (productIDsInputValue === "") {
            fetchProductImages(null);
            return;
        }

        const productIDs = productIDsInputValue
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id));

        const allNumbers = productIDsInputValue.split(',')
            .map(id => id.trim())
            .every(id => /^[0-9]+$/.test(id));

        if (!allNumbers) {
            errorMessage.innerHTML = `
                <div class="error-notification">
                    <h3>Некорректный ввод</h3>
                    <p>Пожалуйста, введите корректные ID товаров (только числа).</p>
                </div>
            `;
            errorMessage.style.display = 'block';
            return;
        }

        fetchProductImages(productIDs);
    });
});
