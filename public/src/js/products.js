// Products management module
import authService from './authorization.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize authentication
    try {
        await authService.init({ debugMode: false });
        if (!authService.isAuthenticated()) {
            console.log("User not authenticated, redirecting to login...");
            authService.login();
            return;
        }
    } catch (error) {
        console.warn("Authentication error:", error);
        // Continue with local authentication for development
        if (!localStorage.getItem('isLoggedIn')) {
            authService.login();
            return;
        }
    }

    // Constants
    const API_BASE_URL = 'http://localhost:8081/api/v1';

    // DOM Elements
    const productsTable = document.getElementById('productsTable');
    const tableBody = productsTable.querySelector('tbody');
    const searchInput = document.getElementById('searchInput');
    const limitSelect = document.getElementById('limitSelect');
    const refreshBtn = document.getElementById('refreshBtn');
    const addProductBtn = document.getElementById('addProductBtn');
    const apiStatus = document.getElementById('apiStatus');
    const apiError = document.getElementById('apiError');
    const errorMessage = document.getElementById('errorMessage');
    const shownCount = document.getElementById('shownCount');
    const totalCount = document.getElementById('totalCount');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    // Form Elements
    const productFormOverlay = document.getElementById('productFormOverlay');
    const productForm = document.getElementById('productForm');
    const productFormTitle = document.getElementById('productFormTitle');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const cancelFormBtn = document.getElementById('cancelFormBtn');
    const productId = document.getElementById('productId');
    const productName = document.getElementById('productName');
    const productPrice = document.getElementById('productPrice');
    const productDescription = document.getElementById('productDescription');
    const productMetadata = document.getElementById('productMetadata');
    const formError = document.getElementById('formError');
    const formErrorMessage = document.getElementById('formErrorMessage');

    // Delete Modal Elements
    const deleteConfirmOverlay = document.getElementById('deleteConfirmOverlay');
    const deleteProductName = document.getElementById('deleteProductName');
    const closeDeleteConfirmBtn = document.getElementById('closeDeleteConfirmBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // State
    let state = {
        products: [],
        page: 1,
        limit: parseInt(limitSelect.value),
        searchQuery: '',
        totalCount: 0,
        isLoading: false,
        currentProductId: null
    };

    // Initialize
    initEventListeners();
    loadProducts();

    // Event Listeners
    function initEventListeners() {
        // Table controls
        searchInput.addEventListener('input', debounce(handleSearchInput, 500));
        limitSelect.addEventListener('change', handleLimitChange);
        refreshBtn.addEventListener('click', handleRefresh);
        addProductBtn.addEventListener('click', handleAddProduct);
        prevPageBtn.addEventListener('click', handlePrevPage);
        nextPageBtn.addEventListener('click', handleNextPage);

        // Form controls
        productForm.addEventListener('submit', handleFormSubmit);
        closeFormBtn.addEventListener('click', closeProductForm);
        cancelFormBtn.addEventListener('click', closeProductForm);

        // Delete confirmation
        closeDeleteConfirmBtn.addEventListener('click', closeDeleteConfirm);
        cancelDeleteBtn.addEventListener('click', closeDeleteConfirm);
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    // Data Loading Functions
    async function loadProducts() {
        if (state.isLoading) return;

        showLoading();
        state.isLoading = true;

        try {
            // Build query parameters
            const queryParams = new URLSearchParams({
                page: state.page,
                page_size: state.limit
            });

            if (state.searchQuery) {
                queryParams.append('q', state.searchQuery);
            }

            const response = await authService.fetchAuthenticated(
                `${API_BASE_URL}/products?${queryParams.toString()}`
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load products');
            }

            state.products = data.data || [];
            state.totalCount = data.meta?.pagination?.total || 0;

            updateProductsTable();
            updatePagination();
            hideLoading();
        } catch (error) {
            console.error("Error loading products:", error);
            displayError(`Ошибка загрузки товаров: ${error.message}`);

            // Show empty table state
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="bi bi-exclamation-circle"></i>
                            </div>
                            <h4>Не удалось загрузить товары</h4>
                            <p>Произошла ошибка при загрузке данных. Пожалуйста, попробуйте обновить страницу.</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise me-2"></i>Обновить
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } finally {
            state.isLoading = false;
        }
    }

    async function getProduct(productId) {
        showLoading();

        try {
            const response = await authService.fetchAuthenticated(
                `${API_BASE_URL}/products/${productId}`
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load product');
            }

            return data.data;
        } catch (error) {
            console.error(`Error loading product ${productId}:`, error);
            showToast('error', `Ошибка загрузки товара: ${error.message}`);
            throw error;
        } finally {
            hideLoading();
        }
    }

    async function createProduct(productData) {
        showLoading();

        try {
            const response = await authService.fetchAuthenticated(
                `${API_BASE_URL}/products`,
                {
                    method: 'POST',
                    body: JSON.stringify(productData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: Failed to create product`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create product');
            }

            showToast('success', 'Товар успешно создан');
            return data.data;
        } catch (error) {
            console.error("Error creating product:", error);
            showToast('error', `Ошибка создания товара: ${error.message}`);
            throw error;
        } finally {
            hideLoading();
        }
    }

    async function updateProduct(productId, productData) {
        showLoading();

        try {
            const response = await authService.fetchAuthenticated(
                `${API_BASE_URL}/products/${productId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(productData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: Failed to update product`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to update product');
            }

            showToast('success', 'Товар успешно обновлен');
            return data.data;
        } catch (error) {
            console.error(`Error updating product ${productId}:`, error);
            showToast('error', `Ошибка обновления товара: ${error.message}`);
            throw error;
        } finally {
            hideLoading();
        }
    }

    async function deleteProduct(productId) {
        showLoading();

        try {
            const response = await authService.fetchAuthenticated(
                `${API_BASE_URL}/products/${productId}`,
                {
                    method: 'DELETE'
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: Failed to delete product`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to delete product');
            }

            showToast('success', 'Товар успешно удален');
            return true;
        } catch (error) {
            console.error(`Error deleting product ${productId}:`, error);
            showToast('error', `Ошибка удаления товара: ${error.message}`);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // UI Update Functions
    function updateProductsTable() {
        if (state.products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="bi bi-box-seam"></i>
                            </div>
                            <h4>Нет товаров</h4>
                            <p>Добавьте новый товар, нажав на кнопку "Добавить товар"</p>
                        </div>
                    </td>
                </tr>
            `;
            shownCount.textContent = '0';
            totalCount.textContent = '0';
            return;
        }

        tableBody.innerHTML = '';

        state.products.forEach(product => {
            const baseData = parseJsonField(product.base_data);
            const row = document.createElement('tr');

            // Format dates
            const createdDate = new Date(product.created_at);
            const updatedDate = new Date(product.updated_at);

            const price = baseData.price ? `${baseData.price.toLocaleString()} ₽` : 'Н/Д';
            const description = baseData.description ? truncateText(baseData.description, 50) : 'Нет описания';

            row.innerHTML = `
                <td>${product.id}</td>
                <td>${baseData.name || 'Без названия'}</td>
                <td>${price}</td>
                <td>${description}</td>
                <td>${formatDate(createdDate)}</td>
                <td>${formatDate(updatedDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}" data-name="${baseData.name || 'Без названия'}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.edit-product').forEach(button => {
            button.addEventListener('click', () => handleEditProduct(button.dataset.id));
        });

        document.querySelectorAll('.delete-product').forEach(button => {
            button.addEventListener('click', () => handleDeleteProduct(button.dataset.id, button.dataset.name));
        });

        // Update counters
        shownCount.textContent = state.products.length;
        totalCount.textContent = state.totalCount;
    }

    function updatePagination() {
        const totalPages = Math.ceil(state.totalCount / state.limit);

        // Update prev/next buttons
        prevPageBtn.parentElement.classList.toggle('disabled', state.page <= 1);
        nextPageBtn.parentElement.classList.toggle('disabled', state.page >= totalPages);

        // Remove existing page buttons
        document.querySelectorAll('.page-numbers').forEach(el => el.remove());

        // Only show pagination if we have more than one page
        if (totalPages <= 1) {
            return;
        }

        // Create page number buttons
        const pageNumbers = document.createElement('li');
        pageNumbers.className = 'page-item page-numbers';
        pageNumbers.innerHTML = `<span class="page-link">${state.page} из ${totalPages}</span>`;

        // Insert before the next button
        nextPageBtn.parentElement.before(pageNumbers);
    }

    // Form Handling
    function openProductForm(isEdit = false) {
        productFormTitle.textContent = isEdit ? 'Редактировать товар' : 'Добавить товар';
        productForm.reset();
        formError.classList.add('d-none');

        // Reset validation state
        productForm.classList.remove('was-validated');

        // Make sure metadata has valid JSON
        productMetadata.value = '{}';

        productFormOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeProductForm() {
        productFormOverlay.classList.remove('active');
        document.body.style.overflow = '';
        state.currentProductId = null;
    }

    async function fillProductForm(product) {
        productId.value = product.id;

        // Parse base data
        const baseData = parseJsonField(product.base_data);

        // Fill form fields
        productName.value = baseData.name || '';
        productPrice.value = baseData.price || '';
        productDescription.value = baseData.description || '';

        // Format metadata for display
        const metadata = parseJsonField(product.metadata);
        productMetadata.value = JSON.stringify(metadata, null, 2);
    }

    function validateProductForm() {
        const form = productForm;

        // Add validation class to show errors
        form.classList.add('was-validated');

        // Check required fields
        if (!productName.value.trim()) {
            productName.classList.add('is-invalid');
            return false;
        } else {
            productName.classList.remove('is-invalid');
        }

        if (!productPrice.value || parseFloat(productPrice.value) <= 0) {
            productPrice.classList.add('is-invalid');
            return false;
        } else {
            productPrice.classList.remove('is-invalid');
        }

        // Validate JSON in metadata field
        if (productMetadata.value.trim()) {
            try {
                JSON.parse(productMetadata.value);
                productMetadata.classList.remove('is-invalid');
            } catch (e) {
                productMetadata.classList.add('is-invalid');
                return false;
            }
        }

        return true;
    }

    function getFormData() {
        // Create base data object
        const baseData = {
            name: productName.value.trim(),
            price: parseFloat(productPrice.value),
            description: productDescription.value.trim()
        };

        // Create product data object
        const productData = {
            base_data: JSON.stringify(baseData)
        };

        // Add metadata if provided
        if (productMetadata.value.trim()) {
            try {
                const metadata = JSON.parse(productMetadata.value);
                productData.metadata = JSON.stringify(metadata);
            } catch (e) {
                console.error("Invalid metadata JSON:", e);
            }
        }

        return productData;
    }

    // Delete Handling
    function openDeleteConfirm(productId, productName) {
        state.currentProductId = productId;
        deleteProductName.textContent = productName;
        deleteConfirmOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDeleteConfirm() {
        deleteConfirmOverlay.classList.remove('active');
        document.body.style.overflow = '';
        state.currentProductId = null;
    }

    // Event Handlers
    function handleSearchInput() {
        state.searchQuery = searchInput.value.trim();
        state.page = 1; // Reset to first page
        loadProducts();
    }

    function handleLimitChange() {
        state.limit = parseInt(limitSelect.value);
        state.page = 1; // Reset to first page
        loadProducts();
    }

    function handleRefresh() {
        loadProducts();
    }

    function handlePrevPage() {
        if (state.page > 1) {
            state.page--;
            loadProducts();
        }
    }

    function handleNextPage() {
        const totalPages = Math.ceil(state.totalCount / state.limit);
        if (state.page < totalPages) {
            state.page++;
            loadProducts();
        }
    }

    function handleAddProduct() {
        openProductForm(false);
    }

    async function handleEditProduct(id) {
        try {
            const product = await getProduct(id);
            state.currentProductId = id;
            openProductForm(true);
            fillProductForm(product);
        } catch (error) {
            console.error(`Error preparing edit form for product ${id}:`, error);
            // Error already shown in getProduct
        }
    }

    function handleDeleteProduct(id, name) {
        openDeleteConfirm(id, name);
    }

    async function handleFormSubmit(event) {
        event.preventDefault();

        if (!validateProductForm()) {
            return;
        }

        formError.classList.add('d-none');

        try {
            const productData = getFormData();

            if (state.currentProductId) {
                // Update existing product
                await updateProduct(state.currentProductId, productData);
            } else {
                // Create new product
                await createProduct(productData);
            }

            closeProductForm();
            loadProducts(); // Refresh the table
        } catch (error) {
            formError.classList.remove('d-none');
            formErrorMessage.textContent = error.message;
        }
    }

    async function confirmDelete() {
        if (!state.currentProductId) return;

        try {
            await deleteProduct(state.currentProductId);
            closeDeleteConfirm();
            loadProducts(); // Refresh the table
        } catch (error) {
            // Error already shown in deleteProduct
            closeDeleteConfirm();
        }
    }

    // Utility Functions
    function showLoading() {
        apiStatus.classList.remove('d-none');
        apiError.classList.add('d-none');
    }

    function hideLoading() {
        apiStatus.classList.add('d-none');
    }

    function displayError(message) {
        apiError.classList.remove('d-none');
        errorMessage.textContent = message;
    }

    function parseJsonField(jsonString) {
        if (!jsonString) return {};

        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Error parsing JSON:", e);
            return {};
        }
    }

    function formatDate(date) {
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function showToast(type, message) {
        if (typeof toastr !== 'undefined') {
            toastr[type](message);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
});