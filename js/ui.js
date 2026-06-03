let catalogProducts = [];
let favoriteIdsCache = [];
let catalogPage = 0;
let catalogPageSize = 8;
let catalogTotalPages = 1;
let catalogIsLoading = false;
let catalogInfiniteScrollListenerAdded = false;

function formatPriceUSD(price) {
    if (price == null || isNaN(price)) {
        return "$0";
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(price);
}

async function loadFavoritesCache() {
    const result = await apiGetFavorites(); 
    favoriteIdsCache = Array.isArray(result) ? result.map(p => p.id) : [];
}

async function refreshFavoritesState() {
    await loadFavoritesCache();
    const path = window.location.pathname.replace(/\/+$|^\s+|\s+$/g, "");

    if (path === "/catalog") {
        renderCatalog(catalogProducts);
    } else if (path.startsWith("/product/")) {
        const productId = path.split("/")[2];
        if (productId) {
            await renderProductDetail(productId);
        }
    } else if (path === "/favorites") {
        await renderFavoritesPage();
    } else if (path === "/profile") {
        await renderFavoritesInProfile();
    }
}

async function clearFavoritesState() {
    favoriteIdsCache = [];
    localStorage.removeItem("byteclub_favorites");
    document.querySelectorAll(".fav-toggle-btn").forEach(btn => {
        updateFavoriteButton(btn, false);
    });

    const path = window.location.pathname.replace(/\/+$|^\s+|\s+$/g, "");
    if (path === "/catalog") {
        renderCatalog(catalogProducts);
    } else if (path.startsWith("/product/")) {
        const productId = path.split("/")[2];
        if (productId) {
            await renderProductDetail(productId);
        }
    } else if (path === "/favorites") {
        await renderFavoritesPage();
    } else if (path === "/profile") {
        await renderFavoritesInProfile();
    }
}

async function addToFavorites(product) {
    console.log("Добавляем товар:", product); // Убедитесь, что здесь есть ID
    if (!product || !product.id) {
        console.error("У товара нет ID!");
        return false;
    }
    const res = await apiAddToFavorites(product.id);

    if (res?.error) {
        alert(res.error);
        return false;
    }

    await loadFavoritesCache();
    alert(`Товар "${product.name}" добавлен в избранное!`);
    return true;
}

async function removeFromFavorites(productId) {
    const res = await apiRemoveFromFavorites(productId);

    if (res?.error) {
        alert(res.error);
        return false;
    }

    await loadFavoritesCache();

    // обновляем UI
    if (window.location.pathname === "/favorites") {
        renderFavoritesPage();
    }

    if (window.location.pathname === "/profile") {
        renderFavoritesInProfile();
    }

    document.querySelectorAll(".fav-toggle-btn").forEach(btn => {
        updateFavoriteButton(btn, false);
    });

    return true;
}

function isProductFavorited(productId) {
    return favoriteIdsCache.includes(productId);
}

function updateFavoriteButton(btn, isFavorite) {
    if (!btn) return;
    if (isFavorite) {
        btn.style.backgroundColor = '#ef4444';
        btn.style.color = '#ffffff';
        btn.title = 'Убрать из избранного';
    } else {
        btn.style.backgroundColor = '#f1f5f9';
        btn.style.color = '#475569';
        btn.title = 'В избранное';
    }
}

async function loadCatalogProducts(sortOption = '', append = false) {
    if (catalogIsLoading) return { error: 'loading' };
    catalogIsLoading = true;
    setCatalogLoading(true);

    try {
        // map UI sort values like 'price-asc' -> 'price,asc'
        let sortParam = '';
        if (sortOption) {
            const parts = sortOption.split('-');
            if (parts.length === 2) sortParam = `${parts[0]},${parts[1]}`;
        }

        const result = await apiGetProducts(catalogPage, catalogPageSize, sortParam);
        if (result.error) {
            const container = document.getElementById("catalog-container");
            if (container) {
                container.innerHTML = `<p style="color: #c00;">${result.error}</p>`;
            }
            if (!append) {
                catalogProducts = [];
            }
            updateCatalogStatus();
            return { error: result.error };
        }

        // result is a Page object from Spring — content + metadata
        const contents = Array.isArray(result.content) ? result.content : [];
        if (append) {
            catalogProducts = [...catalogProducts, ...contents];
        } else {
            catalogProducts = contents;
        }
        catalogPage = result.number || 0;
        catalogTotalPages = result.totalPages || 1;
        renderCatalog(catalogProducts);
        updateCatalogStatus();
        return catalogProducts;
    } finally {
        catalogIsLoading = false;
        setCatalogLoading(false);
    }
}

function setCatalogLoading(isLoading) {
    const loader = document.getElementById('catalog-loading');
    if (!loader) return;
    loader.style.display = isLoading ? 'block' : 'none';
}

function updateCatalogStatus() {
    const status = document.getElementById('catalog-status');
    if (!status) return;
    if (catalogIsLoading) {
        status.textContent = `Страница ${catalogPage + 1} из ${catalogTotalPages} · загружается...`;
    } else {
        status.textContent = `Страница ${Math.min(catalogPage + 1, catalogTotalPages)} из ${catalogTotalPages}`;
    }
}

function initCatalogInfiniteScroll() {
    if (catalogInfiniteScrollListenerAdded) return;
    catalogInfiniteScrollListenerAdded = true;

    window.addEventListener('scroll', async () => {
        if (window.location.pathname !== '/catalog') return;
        if (catalogIsLoading || catalogPage >= catalogTotalPages - 1) return;

        const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 240;
        if (!nearBottom) return;

        const sortSelect = document.getElementById('catalog-sort-select');
        const sortVal = sortSelect ? sortSelect.value : '';
        catalogPage += 1;
        await loadCatalogProducts(sortVal, true);
        applyCatalogFilters();
    });
}

async function loadNextCatalogPage(sortOption = '') {
    if (catalogIsLoading || catalogPage >= catalogTotalPages - 1) return;
    catalogPage += 1;
    await loadCatalogProducts(sortOption, true);
    applyCatalogFilters();
}

// Инициализация интерфейса при загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
    // Настройка обработчика кликов по ссылкам роутера
    window.onpopstate = () => routeFrontend(window.location.pathname);

    // Проверка сессии и загрузка избранного перед начальным рендером
    await checkSession();
    await loadFavoritesCache();

    // Первичный роутинг по текущему URL
    await routeFrontend(window.location.pathname);

    // Инициализация поиска и сортировки в каталоге
    initCatalogControls();
});

// Навигация (Клиентский Роутер)
function navigateTo(path) {
    window.history.pushState({}, "", path);
    routeFrontend(path);
}

async function renderFavoritesPage() {

    const container =
        document.getElementById("favorites-page-container");

    if (!container) return;

    // Получаем список избранного с сервера
    let favorites = await apiGetFavorites();

    if (favorites?.error) {
        container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#c00;">${favorites.error}</p>`;
        return;
    }

    favorites = Array.isArray(favorites) ? favorites : [];

    if (catalogProducts.length === 0) {
        await loadCatalogProducts();
    }

    // Удаляем несуществующие товары
    favorites = favorites.filter(fav =>
        catalogProducts.some(p => p.id === fav.id)
    );

    // Обновляем локальное хранилище для совместимости с остальным UI
    localStorage.setItem("byteclub_favorites", JSON.stringify(favorites));

    container.innerHTML = "";

    if (favorites.length === 0) {
        container.innerHTML = `
            <p style="
                grid-column: 1/-1;
                text-align:center;
                color:#64748b;
            ">
                У вас пока нет избранных товаров
            </p>
        `;
        return;
    }

    favorites.forEach(product => {
        container.appendChild(
            createProductCardElement(product, true)
        );
    });
}

async function routeFrontend(path) {
    path = path.replace(/\/+$|^\s+|\s+$/g, "");
    if (path === "") {
        path = "/";
    }

    // Скрываем абсолютно все секции
    document.getElementById("home-page").style.display = "none";
    document.getElementById("catalog-page").style.display = "none";
    document.getElementById("cart-page").style.display = "none";
    document.getElementById("auth-page").style.display = "none";
    document.getElementById("profile-page").style.display = "none";
    document.getElementById("favorites-page").style.display = "none";
    document.getElementById("product-detail-page").style.display = "none";
    document.getElementById("admin-page").style.display = "none";
    document.getElementById("not-found-page").style.display = "none";

    const headerSearch = document.getElementById("header-search");
    if (headerSearch) {
        headerSearch.style.display = "none";
        headerSearch.classList.remove("active");
    }

    // Обработка динамического пути товара /product/{id}
    if (path.startsWith("/product/")) {
        document.getElementById("product-detail-page").style.display = "block";
        const productId = path.split("/")[2];
        await renderProductDetail(productId);
        return;
    }

    // Роутинг фиксированных путей
    switch (path) {
        case "/":
        case "":
            document.getElementById("home-page").style.display = "block";
            break;
        case "/catalog":
            document.getElementById("catalog-page").style.display = "block";
            catalogPage = 0;
            const sortSelect = document.getElementById("catalog-sort-select");
            const sortVal = sortSelect ? sortSelect.value : '';
            const products = await loadCatalogProducts(sortVal);
            if (!products.error) {
                applyCatalogFilters();
            }
            initCatalogInfiniteScroll();
            if (headerSearch) {
                headerSearch.style.display = "flex";
                headerSearch.classList.add("active");
            }
            break;
        case "/search":
            navigateTo("/catalog");
            return;
        case "/cart":
            document.getElementById("cart-page").style.display = "block";
            renderCart();
            break;
        case "/auth":
            document.getElementById("auth-page").style.display = "block";
            if (typeof clearAuthForms === 'function') {
                clearAuthForms();
            }
            switchAuthMode('login');
            break;
        case "/profile":
            const profileLink = document.getElementById("nav-profile-link");

            if (profileLink.style.display === "none") {
                navigateTo("/auth");
                return;
            }

            document.getElementById("profile-page").style.display = "block";

            await renderFavoritesInProfile();

            break;
        case "/favorites":

            document.getElementById("favorites-page").style.display = "block";

            renderFavoritesPage();

            break;

        case "/admin":
            // Render admin panel only for admin users
            (async () => {
                const profile = await apiCheckProfile();
                const adminPage = document.getElementById("admin-page");
                const adminWarning = document.getElementById("admin-warning");
                const adminControls = document.getElementById("admin-controls");

                if (!adminPage) return;

                if (profile && profile.admin) {
                    adminWarning.style.display = "none";
                    adminControls.style.display = "block";
                    adminPage.style.display = "block";
                    renderAdminTools();
                } else {
                    adminControls.style.display = "none";
                    adminWarning.style.display = "block";
                    adminPage.style.display = "block";
                }
            })();
            break;
        default:
            document.getElementById("not-found-page").style.display = "block";
            return;
    }
}
function createProductCardElement(product, isFavoriteView = false) {
    const card = document.createElement("div");
    card.className = "product-card";

    card.addEventListener("click", (e) => {
        // если нажали на кнопку — НЕ открываем товар
        if (e.target.closest("button")) {
            return;
        }

        navigateTo(`/product/${product.id}`);
    });

    card.innerHTML = `
        <img src="${product.imageUrl || 'https://via.placeholder.com/240x180?text=ByteClub'}" alt="${product.name}">

        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>

            <div class="product-price">
                ${formatPriceUSD(product.price)}
            </div>

            <div class="card-buttons-container" style="display:flex; gap:8px; margin-top:auto;">
                
                <button type="button" class="product-button cart-btn">
                    В корзину
                </button>

                ${
                    isFavoriteView
                    ? `
                        <button type="button" class="product-button danger">
                            ✕
                        </button>
                    `
                    : `
                        <button type="button" class="product-button fav-toggle-btn">
                            ♥
                        </button>
                    `
                }
            </div>
        </div>
    `;

    // КОРЗИНА
    const cartBtn = card.querySelector(".cart-btn");

    cartBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        await addToCart(product.id);
    });

    // ИЗБРАННОЕ
    if (isFavoriteView) {
        const delBtn = card.querySelector(".danger");

        delBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            await removeFromFavorites(product.id);
        });

    } else {

        const favBtn = card.querySelector(".fav-toggle-btn");

        updateFavoriteButton(
            favBtn,
            isProductFavorited(product.id)
        );

        favBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isFav = isProductFavorited(product.id);

            if (isFav) {
                const ok = await removeFromFavorites(product.id);
                if (ok) {
                    updateFavoriteButton(favBtn, false);
                }
            } else {
                const ok = await addToFavorites(product);
                if (ok) {
                    updateFavoriteButton(favBtn, true);
                } else {
                    updateFavoriteButton(favBtn, false);
                }
            }
        });
    }

    return card;
}

// Отрисовка основного каталога
function renderCatalog(products) {
    const container = document.getElementById("catalog-container");
    container.innerHTML = "";
    if (products.length === 0) {
        container.innerHTML = "<p>Товары не найдены.</p>";
        return;
    }
    products.forEach(prod => {
        container.appendChild(createProductCardElement(prod, false));
    });
}

// Инициализация поиска и сортировки внутри каталога
function initCatalogControls() {
    const searchBtn = document.getElementById("header-search-btn");
    const searchInput = document.getElementById("header-search-input");
    const sortSelect = document.getElementById("catalog-sort-select");

    const refreshCatalog = async () => {
        if (catalogProducts.length === 0) {
            await loadCatalogProducts();
        }
        if (window.location.pathname !== "/catalog") {
            navigateTo("/catalog");
        } else {
            applyCatalogFilters();
        }
    };

    if (searchBtn && searchInput) {
        searchBtn.onclick = refreshCatalog;
        searchInput.onkeypress = (e) => { if (e.key === 'Enter') refreshCatalog(); };
    }

    if (sortSelect) {
        sortSelect.onchange = async () => {
            catalogPage = 0;
            const val = sortSelect.value;
            await loadCatalogProducts(val);
            applyCatalogFilters();
        };
    }
}

function sortCatalogProducts(products, sortOption) {
    const sorted = [...products];
    switch (sortOption) {
        case 'price-asc':
            sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-desc':
            sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'name-asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
            break;
        case 'name-desc':
            sorted.sort((a, b) => b.name.localeCompare(a.name, 'ru', { sensitivity: 'base' }));
            break;
        default:
            break;
    }
    return sorted;
}

function applyCatalogFilters() {
    const searchInput = document.getElementById("header-search-input");
    const sortSelect = document.getElementById("catalog-sort-select");

    let filtered = Array.isArray(catalogProducts) ? [...catalogProducts] : [];
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    // Sorting is performed server-side now across whole catalog;
    // we only render the current page (already sorted by server).
    renderCatalog(filtered);
}

// Функции управления корзиной
function getCartItems() {
    return JSON.parse(localStorage.getItem("byteclub_cart")) || [];
}

function saveCartItems(items) {
    localStorage.setItem("byteclub_cart", JSON.stringify(items));
}

function updateCartItemQuantity(productId, quantity) {
    let cart = getCartItems();
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCartItems(cart);
            renderCart();
        }
    }
}

function getCartTotal() {
    const cart = getCartItems();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}


async function renderProductDetail(id) {
    const container = document.getElementById("product-detail-container");
    let product = catalogProducts.find(p => p.id == id);

    if (!product) {
        const result = await apiGetProductById(id);
        if (!result || result.error) {
            container.innerHTML = "<p>Товар не найден.</p>";
            return;
        }
        product = result;
    }

    container.innerHTML = `
        <div style="display: flex; gap: 40px; background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
            <img src="${product.imageUrl || 'https://via.placeholder.com/400x300?text=ByteClub'}" alt="${product.name}" style="max-width: 400px; width: 100%; border-radius: 6px; object-fit: contain;">
            <div>
                <h2 style="margin-bottom: 15px;">${product.name}</h2>
                <div style="font-size: 24px; font-weight: 700; color: #007bff; margin-bottom: 20px;">${formatPriceUSD(product.price)}</div>
                <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">${product.description || 'Описание товара пока не добавлено.'}</p>
                <div style="display:flex; gap:10px; align-items:center;">
                    <button id="detail-add-cart-btn" class="product-button" style="padding: 12px 20px;">Добавить в корзину</button>
                    <button id="detail-fav-btn" class="product-button fav-toggle-btn" style="padding: 12px 14px;">♥ В избранное</button>
                </div>
            </div>
        </div>
    `;

    // Подключаем обработчики для кнопок на странице товара
    const detailAddBtn = container.querySelector('#detail-add-cart-btn');
    const detailFavBtn = container.querySelector('#detail-fav-btn');

    if (detailAddBtn) {
        detailAddBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await addToCart(product.id);
        });
    }

    if (detailFavBtn) {
        // Устанавливаем начальное состояние кнопки
        updateFavoriteButton(detailFavBtn, isProductFavorited(product.id));

        detailFavBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currently = isProductFavorited(product.id);
            if (currently) {
                const ok = await removeFromFavorites(product.id);
                if (ok) updateFavoriteButton(detailFavBtn, false);
            } else {
                const ok = await addToFavorites(product);
                if (ok) updateFavoriteButton(detailFavBtn, true);
            }
        });
    }
}

// Admin panel render function
function renderAdminTools() {
    const tools = document.getElementById('admin-tools');
    if (!tools) return;
    tools.innerHTML = '';

    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gap = '30px';

    // Products section
    const productsSection = document.createElement('div');
    productsSection.innerHTML = '<h3>Управление товарами</h3>';
    
    const addProductForm = document.createElement('div');
    addProductForm.style.marginBottom = '20px';
    addProductForm.style.padding = '15px';
    addProductForm.style.background = '#f8fafc';
    addProductForm.style.borderRadius = '8px';
    addProductForm.innerHTML = `
        <h4 style="margin-bottom: 10px;">Добавить товар</h4>
        <input type="text" id="admin-product-name" placeholder="Название" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
        <input type="number" id="admin-product-price" placeholder="Цена (USD)" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
        <input type="text" id="admin-product-image" placeholder="URL изображения" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
        <textarea id="admin-product-description" placeholder="Описание товара" rows="4" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #cbd5e1; border-radius: 4px; resize: vertical;"></textarea>
        <button id="admin-add-product-btn" class="product-button" style="width: 100%;">Добавить</button>
    `;
    
    const productsList = document.createElement('div');
    productsList.id = 'admin-products-list';
    productsList.style.maxHeight = '400px';
    productsList.style.overflowY = 'auto';
    
    productsSection.appendChild(addProductForm);
    productsSection.appendChild(productsList);

    // Users section
    const usersSection = document.createElement('div');
    usersSection.innerHTML = '<h3>Управление пользователями</h3>';
    const usersList = document.createElement('div');
    usersList.id = 'admin-users-list';
    usersList.style.maxHeight = '400px';
    usersList.style.overflowY = 'auto';
    usersSection.appendChild(usersList);

    container.appendChild(productsSection);
    container.appendChild(usersSection);
    tools.appendChild(container);

    // Load data
    loadAdminProducts();
    loadAdminUsers();

    // Bind add product button
    document.getElementById('admin-add-product-btn').onclick = addNewProduct;
}

async function loadAdminProducts() {
    const result = await apiAdminGetProducts();
    const list = document.getElementById('admin-products-list');
    
    if (!list) return;
    list.innerHTML = '';

    if (result.error) {
        list.innerHTML = `<p style="color: #c00;">${result.error}</p>`;
        return;
    }

    const products = Array.isArray(result) ? result : [];
    
    if (products.length === 0) {
        list.innerHTML = '<p>Нет товаров</p>';
        return;
    }

    products.forEach(p => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '10px';
        row.style.marginBottom = '8px';
        row.style.border = '1px solid #e2e8f0';
        row.style.borderRadius = '6px';
        row.innerHTML = `<div><strong>${p.name}</strong><br><small>${formatPriceUSD(p.price)}</small></div>`;

        const delBtn = document.createElement('button');
        delBtn.className = 'product-button danger';
        delBtn.textContent = 'Удалить';
        delBtn.style.width = 'auto';
        delBtn.style.padding = '6px 12px';
        delBtn.onclick = async () => {
            if (confirm(`Удалить товар "${p.name}"?`)) {
                const res = await apiAdminDeleteProduct(p.id);
                if (res.error) {
                    alert('Ошибка: ' + res.error);
                } else {
                    await loadAdminProducts();
                    await loadAdminUsers();
                    await loadCatalogProducts();
                    if (window.location.pathname === "/" || window.location.pathname === "") {
                        renderCatalog(catalogProducts);
                    }
                }
            }
        };

        row.appendChild(delBtn);
        list.appendChild(row);
    });
}

async function renderAdminProducts() {
    const list = document.getElementById("admin-products-list");
    if (!list) return;

    const products = await apiAdminGetProducts();
    
    // Очищаем перед рендерингом
    list.innerHTML = ""; 
    
    if (products?.error) {
        list.innerHTML = `<p style="color:red">Ошибка: ${products.error}</p>`;
        return;
    }

    products.forEach(p => {
        const item = document.createElement("div");
        item.className = "admin-item";
        item.innerHTML = `
            <span>${p.name}</span>
            <button onclick="deleteProduct(${p.id})" class="cart-remove-btn">Удалить</button>
        `;
        list.appendChild(item);
    });
}

async function loadAdminUsers() {
    const result = await apiAdminGetUsers();
    const profile = await apiCheckProfile();
    const currentUsername = profile && profile.username ? profile.username : null;
    const list = document.getElementById('admin-users-list');
    
    if (!list) return;
    list.innerHTML = '';

    if (result.error) {
        list.innerHTML = `<p style="color: #c00;">${result.error}</p>`;
        return;
    }

    const users = Array.isArray(result) ? result : [];
    
    if (users.length === 0) {
        list.innerHTML = '<p>Нет пользователей</p>';
        return;
    }

    users.forEach(u => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '10px';
        row.style.marginBottom = '8px';
        row.style.border = '1px solid #e2e8f0';
        row.style.borderRadius = '6px';
        row.innerHTML = `<div><strong>${u.username}</strong><br><small>${u.email}</small></div>`;

        const delBtn = document.createElement('button');
        delBtn.className = 'product-button danger';
        delBtn.textContent = 'Удалить';
        delBtn.style.width = 'auto';
        delBtn.style.padding = '6px 12px';
        if (u.username === currentUsername) {
            delBtn.disabled = true;
            delBtn.style.opacity = '0.5';
            delBtn.title = 'Нельзя удалить собственную учётку';
        } else {
            delBtn.onclick = async () => {
                if (confirm(`Удалить пользователя "${u.username}"?`)) {
                    const res = await apiAdminDeleteUser(u.id);
                    if (res.error) {
                        alert('Ошибка: ' + res.error);
                    } else {
                        loadAdminUsers();
                    }
                }
            };
        }

        row.appendChild(delBtn);
        list.appendChild(row);
    });
}

async function addNewProduct() {
    const nameInput = document.getElementById('admin-product-name');
    const priceInput = document.getElementById('admin-product-price');
    const imageInput = document.getElementById('admin-product-image');

    const name = nameInput.value.trim();
    const price = parseInt(priceInput.value);
    const imageUrl = imageInput.value.trim();
    const description = document.getElementById('admin-product-description').value.trim();

    if (!name) {
        alert('Введите название товара');
        return;
    }
    if (!price || price <= 0) {
        alert('Введите корректную цену');
        return;
    }

    const result = await apiAdminAddProduct(
        name,
        price,
        imageUrl || 'https://via.placeholder.com/240x180?text=ByteClub',
        description
    );
    
    if (result.error) {
        alert('Ошибка: ' + result.error);
    } else {
        alert('Товар добавлен!');
        nameInput.value = '';
        priceInput.value = '';
        imageInput.value = '';
        document.getElementById('admin-product-description').value = '';
        await loadAdminProducts();
        await loadCatalogProducts();
        if (window.location.pathname === "/" || window.location.pathname === "") {
            renderCatalog(catalogProducts);
        } 
    }
}

// ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА КОРЗИНЫ
// Основная функция теперь принимает данные напрямую
async function renderCart() {
    const itemsList = document.getElementById("cart-items-list");
    const emptyState = document.getElementById("cart-empty-state");
    const cartContent = document.getElementById("cart-content");
    
    // Элементы для итогов
    const totalCountEl = document.getElementById("cart-total-count");
    const subtotalPriceEl = document.getElementById("cart-subtotal-price");
    const finalPriceEl = document.getElementById("cart-final-price");

    if (!itemsList) return;

    if (catalogProducts.length === 0) {
        await loadCatalogProducts();
    }

    const cartItems = await apiGetCart();

    // Обработка пустой корзины
    if (!cartItems || cartItems.length === 0 || cartItems.error) {
        cartContent.style.display = "none";
        emptyState.style.display = "block";
        return;
    }

    cartContent.style.display = "flex";
    emptyState.style.display = "none";

    itemsList.innerHTML = "";
    let subtotalPrice = 0;
    let totalCount = 0;

    cartItems.forEach(item => {
        const product = catalogProducts.find(p => p.id == item.productId);

        if (product) {
            subtotalPrice += (product.price * item.quantity);
            totalCount += item.quantity;

            itemsList.innerHTML += `
                <div class="cart-item-card">
                    <div class="cart-item-info">
                        <h4>${product.name}</h4>
                        <p>Цена: ${formatPriceUSD(product.price)}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="product-button" onclick="updateQuantity(${item.productId}, -1);">−</button>
                        <span class="cart-qty">${item.quantity}</span>
                        <button class="product-button" onclick="updateQuantity(${item.productId}, 1);">+</button>
                        <button class="cart-remove-btn" onclick="removeFromCart(${item.productId})">✕</button>
                    </div>
                </div>
            `;
        }
    });

    // Обновляем показатели
    totalCountEl.textContent = totalCount;
    subtotalPriceEl.textContent = formatPriceUSD(subtotalPrice);
    finalPriceEl.textContent = formatPriceUSD(subtotalPrice);
}

// Изменение количества товара (+1 / -1)
function changeCartQuantity(productId, amount) {
    let cart = getCartItems();
    const product = cart.find(p => p.id === productId);
    
    if (product) {
        product.quantity += amount;
        if (product.quantity <= 0) {
            cart = cart.filter(p => p.id !== productId);
        }
        saveCartItems(cart);
    }
}

// Полное удаление товара из корзины
async function removeFromCart(productId) {
    // Вызов нового метода API для удаления товара
    await apiRemoveFromCart(productId);
    renderCart(); // Перерисовываем после удаления
}

// Заглушка для оформления заказа
function processCheckout() {
    alert("Заказ успешно оформлен! Спасибо за покупку в ByteClub.");
    localStorage.removeItem("byteclub_cart");
    renderCart();
    navigateTo("/");
}

async function addToCart(productId) {
    const res = await apiAddToCart(productId);
    if (res?.error) {
        alert("Ошибка: " + res.error);
    } else {
        alert("Товар добавлен в корзину!");
        renderCart(); // Обновляем корзину после добавления
    }
}

async function updateQuantity(productId, amount) {
    try {
        const res = await apiUpdateQuantity(productId, amount);
        if (res?.error) {
            console.error('apiUpdateQuantity error:', res);
            alert(res.error || 'Ошибка обновления количества');
            return;
        }
        await renderCart();
    } catch (e) {
        console.error('updateQuantity failed', e);
        alert('Ошибка сети при обновлении количества');
    }
}
