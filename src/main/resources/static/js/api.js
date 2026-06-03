// 1. Сначала вставляете эту функцию (базовый запрос)
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
            return { error: data?.error || `HTTP ${response.status}` };
        }

        return data;
    } catch (e) {
        console.error(e);
        return { error: 'Ошибка сети' };
    }
}

// 2. А дальше идут ваши функции-обертки, которые используют apiRequest
async function apiRegister(username, email, password, recoveryKeyword) {
    return apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, recoveryKeyword })
    });
}

// ... и остальные ваши функции

// AUTH
async function apiRecoverPassword(usernameOrEmail, recoveryKeyword, newPassword) {
    return apiRequest('/api/auth/restore', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, recoveryKeyword, newPassword })
    });
}

async function apiLogin(username, password) {
    return apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
}

async function apiLogout() {
    return apiRequest('/api/auth/logout', {
        method: 'POST'
    });
}

async function apiCheckProfile() {
    const res = await apiRequest('/api/auth/profile');
    return res?.error ? null : res;
}

// PRODUCTS
async function apiGetProducts(page = 0, size = 12, sort = '') {
    let url = `/api/products?page=${page}&size=${size}`;
    if (sort) {
        // sort expected like 'price,asc' or 'name,desc'
        url += `&sort=${encodeURIComponent(sort)}`;
    }
    return apiRequest(url);
}

async function apiGetProductById(id) {
    const res = await apiRequest(`/api/products/${id}`);
    return res?.error ? null : res;
}

// ADMIN
async function apiAdminGetUsers() {
    return apiRequest('/api/admin/users');
}

async function apiAdminDeleteUser(id) {
    return apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' });
}

async function apiAdminGetProducts() {
    return apiRequest('/api/admin/products');
}

async function apiAdminAddProduct(name, price, imageUrl, description) {
    return apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ name, price, imageUrl, description })
    });
}

async function apiAdminDeleteProduct(id) {
    return apiRequest(`/api/admin/products/${id}`, { method: 'DELETE' });
}

async function apiAddToCart(productId) {
    const res = await apiRequest(`/api/cart/add/${productId}`, {
        method: 'POST'
    });
    
    // Если сервер вернул 401 Unauthorized, обрабатываем это
    if (res?.error && res.error.includes("необходимо войти")) {
        alert("Пожалуйста, войдите в систему, чтобы добавить товар в корзину.");
        navigateTo('/auth');
        return { error: 'redirect' };
    }
    
    return res;
}

// CART
async function apiGetCart() {
    return apiRequest('/api/cart');
}

async function apiRemoveFromCart(productId) {
    return apiRequest(`/api/cart/remove/${productId}`, { method: 'DELETE' });
}

async function apiUpdateQuantity(productId, amount) {
    return apiRequest(`/api/cart/update/${productId}`, { 
        method: 'POST',
        body: JSON.stringify({ amount }) // Сервер должен уметь обрабатывать этот JSON
    });
}

async function apiGetFavorites() {
    return apiRequest('/api/favorites'); // Предполагаемый путь к API
}

async function apiGetFavoriteIds() {
    return apiRequest('/api/favorites/ids');
}

async function apiToggleFavorite(productId) {
    return await apiRequest(`/api/favorites/toggle/${productId}`, {
        method: "POST"
    });
}

async function apiAddToFavorites(productId) {
    return await apiToggleFavorite(productId);
}

async function apiRemoveFromFavorites(productId) {
    return await apiToggleFavorite(productId);
} 
